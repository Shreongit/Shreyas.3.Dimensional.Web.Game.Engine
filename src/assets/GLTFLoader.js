import { Vector3 } from "../math/Vector3.js";
import { Quaternion } from "../math/Quaternion.js";

/**
 * Minimal glTF 2.0 / GLB 2.0 geometry loader.
 * Supports triangle primitives with POSITION, optional NORMAL, and optional indices.
 * Materials, skins, animations, morph targets, Draco and texture decoding are intentionally out of scope.
 */
const COMPONENTS = new Map([[5120, Int8Array], [5121, Uint8Array], [5122, Int16Array], [5123, Uint16Array], [5125, Uint32Array], [5126, Float32Array]]);
const COMPONENT_BYTES = new Map([[5120,1],[5121,1],[5122,2],[5123,2],[5125,4],[5126,4]]);
const TYPE_SIZE = new Map([["SCALAR",1],["VEC2",2],["VEC3",3],["VEC4",4],["MAT2",4],["MAT3",9],["MAT4",16]]);
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

function decodeDataUri(uri) {
  const comma=uri.indexOf(",");
  if(comma<0) throw new Error("Malformed glTF data URI.");
  const metadata=uri.slice(0,comma),payload=uri.slice(comma+1);
  if(metadata.endsWith(";base64")) {
    const binary=typeof atob==="function"?atob(payload):Buffer.from(payload,"base64").toString("binary");
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return bytes.buffer;
  }
  return new TextEncoder().encode(decodeURIComponent(payload)).buffer;
}

function parseGLB(buffer) {
  const view=new DataView(buffer);
  if(buffer.byteLength<12 || view.getUint32(0,true)!==GLB_MAGIC) throw new Error("Invalid GLB header.");
  const version=view.getUint32(4,true),length=view.getUint32(8,true);
  if(version!==2) throw new Error(`Unsupported GLB version ${version}; expected 2.`);
  if(length!==buffer.byteLength) throw new Error("GLB declared length does not match buffer length.");
  let offset=12,json=null,bin=null;
  while(offset+8<=buffer.byteLength) {
    const chunkLength=view.getUint32(offset,true),chunkType=view.getUint32(offset+4,true);
    offset+=8;
    if(offset+chunkLength>buffer.byteLength) throw new Error("GLB chunk extends beyond file length.");
    const chunk=buffer.slice(offset,offset+chunkLength);
    if(chunkType===JSON_CHUNK) {
      if(json) throw new Error("GLB contains multiple JSON chunks.");
      json=JSON.parse(new TextDecoder().decode(chunk).replace(/[\u0000\u0020]+$/g,""));
    } else if(chunkType===BIN_CHUNK && !bin) bin=chunk;
    offset+=chunkLength;
  }
  if(offset!==buffer.byteLength) throw new Error("GLB has a truncated chunk header.");
  if(!json) throw new Error("GLB is missing its JSON chunk.");
  return { json, bin };
}

export class GLTFLoader {
  constructor({ fetchImpl=globalThis.fetch }={}) {
    if(typeof fetchImpl!=="function") throw new TypeError("GLTFLoader requires fetch.");
    this.fetchImpl=fetchImpl;
  }
  async load(url,{signal}={}) {
    if(typeof url!=="string"||!url.trim()) throw new TypeError("glTF URL must be a non-empty string.");
    const response=await this.fetchImpl(url,{signal});
    if(!response.ok) throw new Error(`Failed to fetch glTF "${url}" (HTTP ${response.status}).`);
    const buffer=await response.arrayBuffer();
    let json,glbBin=null;
    if(new URL(url,"http://localhost").pathname.toLowerCase().endsWith(".glb")) ({json,bin:glbBin}=parseGLB(buffer));
    else {
      try { json=JSON.parse(new TextDecoder().decode(buffer)); }
      catch(error) { throw new Error(`Failed to parse glTF JSON: ${error.message}`); }
    }
    this._validateDocument(json);
    const resolvedUrl=new URL(url, globalThis.location?.href || "http://localhost/");
    const base=new URL(".",resolvedUrl);
    const buffers=await Promise.all((json.buffers||[]).map(async (descriptor,index)=>{
      if(!descriptor.uri) {
        if(index===0&&glbBin)return glbBin;
        throw new Error(`glTF buffer ${index} has no URI and no GLB binary chunk.`);
      }
      if(descriptor.uri.startsWith("data:")) return decodeDataUri(descriptor.uri);
      const bufferUrl=new URL(descriptor.uri,base).href;
      const r=await this.fetchImpl(bufferUrl,{signal});
      if(!r.ok)throw new Error(`Failed to fetch glTF buffer "${descriptor.uri}" (HTTP ${r.status}).`);
      return r.arrayBuffer();
    }));
    const meshes=(json.meshes||[]).map((mesh,meshIndex)=>({
      name:mesh.name||`Mesh_${meshIndex}`,
      primitives:(mesh.primitives||[]).map((primitive,primitiveIndex)=>this._readPrimitive(json,buffers,primitive,meshIndex,primitiveIndex))
    }));
    const nodes=(json.nodes||[]).map((node,index)=>({
      index,name:node.name||`Node_${index}`,mesh:node.mesh ?? null,children:[...(node.children||[])],
      translation:new Vector3(...(node.translation||[0,0,0])),
      rotation:new Quaternion(...(node.rotation||[0,0,0,1])).normalize(),
      scale:new Vector3(...(node.scale||[1,1,1])),
      matrix:node.matrix ? [...node.matrix] : null
    }));
    return { asset:json.asset, scene:json.scene??0, scenes:json.scenes||[], nodes, meshes, buffers, json };
  }
  _validateDocument(json) {
    if(!json||typeof json!=="object"||json.asset?.version?.split(".")[0]!=="2") throw new Error("Expected a glTF 2.0 document.");
    if(!Array.isArray(json.buffers)||!Array.isArray(json.bufferViews)||!Array.isArray(json.accessors)) throw new Error("glTF document is missing buffers, bufferViews, or accessors arrays.");
  }
  _readAccessor(json,buffers,index) {
    const a=json.accessors[index];
    if(!a)throw new Error(`Missing accessor ${index}.`);
    if(a.sparse)throw new Error("Sparse glTF accessors are not supported by this loader yet.");
    if(a.bufferView===undefined)throw new Error("Accessors without a bufferView are not supported by this loader yet.");
    const bv=json.bufferViews[a.bufferView],buffer=buffers[bv?.buffer];
    if(!bv||!buffer)throw new Error(`Accessor ${index} references an invalid bufferView or buffer.`);
    const Type=COMPONENTS.get(a.componentType),bytes=COMPONENT_BYTES.get(a.componentType),size=TYPE_SIZE.get(a.type);
    if(!Type||!bytes||!size||!Number.isInteger(a.count)||a.count<0)throw new Error(`Accessor ${index} has unsupported metadata.`);
    const viewStart=bv.byteOffset||0,viewEnd=viewStart+bv.byteLength;
    const stride=bv.byteStride||bytes*size,offset=viewStart+(a.byteOffset||0),end=offset+(Math.max(0,a.count-1)*stride)+(bytes*size);
    if(offset%bytes!==0||end>buffer.byteLength||end>viewEnd)throw new Error(`Accessor ${index} exceeds buffer bounds or is misaligned.`);
    const view=new DataView(buffer);
    const getters=new Map([[Int8Array, (o)=>view.getInt8(o)],[Uint8Array,(o)=>view.getUint8(o)],[Int16Array,(o)=>view.getInt16(o,true)],[Uint16Array,(o)=>view.getUint16(o,true)],[Uint32Array,(o)=>view.getUint32(o,true)],[Float32Array,(o)=>view.getFloat32(o,true)]]);
    const get=getters.get(Type),out=new Type(a.count*size);
    for(let i=0;i<a.count;i++)for(let c=0;c<size;c++)out[i*size+c]=get(offset+i*stride+c*bytes);
    return { data:out, count:a.count, size, componentType:a.componentType, normalized:Boolean(a.normalized) };
  }
  _readPrimitive(json,buffers,primitive,meshIndex,primitiveIndex) {
    if(primitive.mode!==undefined&&primitive.mode!==4)throw new Error(`Mesh ${meshIndex} primitive ${primitiveIndex}: only TRIANGLES mode is supported.`);
    const attrs=primitive.attributes||{};
    if(attrs.POSITION===undefined)throw new Error(`Mesh ${meshIndex} primitive ${primitiveIndex} has no POSITION attribute.`);
    const positions=this._readAccessor(json,buffers,attrs.POSITION);
    if(positions.size!==3||positions.componentType!==5126)throw new Error("POSITION must be a FLOAT VEC3 accessor.");
    let normals=attrs.NORMAL===undefined?null:this._readAccessor(json,buffers,attrs.NORMAL);
    if(normals&&(normals.size!==3||normals.count!==positions.count))throw new Error("NORMAL must be a VEC3 accessor matching POSITION count.");
    let indices;
    if(primitive.indices!==undefined) {
      const accessor=this._readAccessor(json,buffers,primitive.indices);
      if(accessor.size!==1||![5121,5123,5125].includes(accessor.componentType))throw new Error("Indices must be an unsigned SCALAR accessor.");
      indices=accessor.data;
    } else indices=Uint32Array.from({length:positions.count},(_,i)=>i);
    if(indices.length%3!==0)throw new Error("Triangle index count must be divisible by three.");
    for(const i of indices)if(i>=positions.count)throw new Error(`Mesh ${meshIndex} contains out-of-range vertex index ${i}.`);
    if(!normals)normals={data:this._generateNormals(positions.data,indices),count:positions.count,size:3};
    return { positions:positions.data, normals:normals.data, indices, material:primitive.material??null, mode:4 };
  }
  _generateNormals(positions,indices) {
    const normals=new Float32Array(positions.length);
    for(let i=0;i+2<indices.length;i+=3) {
      const ia=indices[i]*3,ib=indices[i+1]*3,ic=indices[i+2]*3;
      const a=new Vector3(positions[ia],positions[ia+1],positions[ia+2]);
      const b=new Vector3(positions[ib],positions[ib+1],positions[ib+2]);
      const c=new Vector3(positions[ic],positions[ic+1],positions[ic+2]);
      const n=Vector3.cross(Vector3.sub(b,a),Vector3.sub(c,a)).normalize();
      for(const offset of [ia,ib,ic]) { normals[offset]+=n.x;normals[offset+1]+=n.y;normals[offset+2]+=n.z; }
    }
    for(let i=0;i<normals.length;i+=3) {
      const n=new Vector3(normals[i],normals[i+1],normals[i+2]).normalize();
      normals.set(n.toArray(),i);
    }
    return normals;
  }
}
