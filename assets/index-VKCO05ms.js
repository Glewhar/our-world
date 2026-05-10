(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const al="169",ir={ROTATE:0,DOLLY:1,PAN:2},Qi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},kd=0,ic=1,Bd=2,Hh=1,zd=2,Rn=3,ni=0,zt=1,pn=2,Fn=0,yi=1,lr=2,rc=3,sc=4,Gh=5,_i=100,Vd=101,Hd=102,Gd=103,Wd=104,Xd=200,ho=201,jd=202,Kd=203,uo=204,Br=205,qd=206,Yd=207,$d=208,Zd=209,Jd=210,Qd=211,ep=212,tp=213,np=214,po=0,fo=1,mo=2,cr=3,vo=4,go=5,_o=6,xo=7,Wh=0,ip=1,rp=2,ei=0,sp=1,ap=2,op=3,Xh=4,lp=5,cp=6,hp=7,jh=300,hr=301,ur=302,bo=303,yo=304,ta=306,dr=1e3,_t=1001,wo=1002,ct=1003,up=1004,hs=1005,Tt=1006,ba=1007,bi=1008,xn=1009,Kh=1010,qh=1011,zr=1012,ol=1013,ii=1014,mn=1015,$t=1016,ll=1017,cl=1018,pr=1020,Yh=35902,$h=1021,Zh=1022,Yt=1023,Jh=1024,Qh=1025,rr=1026,fr=1027,Vr=1028,na=1029,qr=1030,hl=1031,ul=1033,Ns=33776,Fs=33777,Os=33778,ks=33779,So=35840,Mo=35841,Eo=35842,To=35843,Co=36196,Ao=37492,Po=37496,Ro=37808,Do=37809,Lo=37810,Io=37811,Uo=37812,No=37813,Fo=37814,Oo=37815,ko=37816,Bo=37817,zo=37818,Vo=37819,Ho=37820,Go=37821,Bs=36492,Wo=36494,Xo=36495,eu=36283,jo=36284,Ko=36285,qo=36286,dp=3200,pp=3201,fp=0,mp=1,Dn="",dn="srgb",si="srgb-linear",dl="display-p3",ia="display-p3-linear",Xs="linear",rt="srgb",js="rec709",Ks="p3",Ui=7680,ac=519,vp=512,gp=513,_p=514,tu=515,xp=516,bp=517,yp=518,wp=519,oc=35044,er=35048,Vt="300 es",In=2e3,qs=2001;class Ai{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const r=this._listeners[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const i=this._listeners[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const At=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],zs=Math.PI/180,Yo=180/Math.PI;function Yr(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(At[n&255]+At[n>>8&255]+At[n>>16&255]+At[n>>24&255]+"-"+At[e&255]+At[e>>8&255]+"-"+At[e>>16&15|64]+At[e>>24&255]+"-"+At[t&63|128]+At[t>>8&255]+"-"+At[t>>16&255]+At[t>>24&255]+At[i&255]+At[i>>8&255]+At[i>>16&255]+At[i>>24&255]).toLowerCase()}function Dt(n,e,t){return Math.max(e,Math.min(t,n))}function Sp(n,e){return(n%e+e)%e}function ya(n,e,t){return(1-t)*n+t*e}function Sr(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Ot(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const Mp={DEG2RAD:zs};class ye{constructor(e=0,t=0){ye.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Dt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ue{constructor(e,t,i,r,s,a,o,l,c){Ue.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],m=i[5],g=i[8],x=r[0],p=r[3],f=r[6],M=r[1],y=r[4],S=r[7],N=r[2],A=r[5],T=r[8];return s[0]=a*x+o*M+l*N,s[3]=a*p+o*y+l*A,s[6]=a*f+o*S+l*T,s[1]=c*x+h*M+u*N,s[4]=c*p+h*y+u*A,s[7]=c*f+h*S+u*T,s[2]=d*x+m*M+g*N,s[5]=d*p+m*y+g*A,s[8]=d*f+m*S+g*T,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-i*s*h+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*s,m=c*s-a*l,g=t*u+i*d+r*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return e[0]=u*x,e[1]=(r*c-h*i)*x,e[2]=(o*i-r*a)*x,e[3]=d*x,e[4]=(h*t-r*l)*x,e[5]=(r*s-o*t)*x,e[6]=m*x,e[7]=(i*l-c*t)*x,e[8]=(a*t-i*s)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(wa.makeScale(e,t)),this}rotate(e){return this.premultiply(wa.makeRotation(-e)),this}translate(e,t){return this.premultiply(wa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const wa=new Ue;function nu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Ys(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Ep(){const n=Ys("canvas");return n.style.display="block",n}const lc={};function Vs(n){n in lc||(lc[n]=!0,console.warn(n))}function Tp(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}function Cp(n){const e=n.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Ap(n){const e=n.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const cc=new Ue().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),hc=new Ue().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Mr={[si]:{transfer:Xs,primaries:js,luminanceCoefficients:[.2126,.7152,.0722],toReference:n=>n,fromReference:n=>n},[dn]:{transfer:rt,primaries:js,luminanceCoefficients:[.2126,.7152,.0722],toReference:n=>n.convertSRGBToLinear(),fromReference:n=>n.convertLinearToSRGB()},[ia]:{transfer:Xs,primaries:Ks,luminanceCoefficients:[.2289,.6917,.0793],toReference:n=>n.applyMatrix3(hc),fromReference:n=>n.applyMatrix3(cc)},[dl]:{transfer:rt,primaries:Ks,luminanceCoefficients:[.2289,.6917,.0793],toReference:n=>n.convertSRGBToLinear().applyMatrix3(hc),fromReference:n=>n.applyMatrix3(cc).convertLinearToSRGB()}},Pp=new Set([si,ia]),qe={enabled:!0,_workingColorSpace:si,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(n){if(!Pp.has(n))throw new Error(`Unsupported working color space, "${n}".`);this._workingColorSpace=n},convert:function(n,e,t){if(this.enabled===!1||e===t||!e||!t)return n;const i=Mr[e].toReference,r=Mr[t].fromReference;return r(i(n))},fromWorkingColorSpace:function(n,e){return this.convert(n,this._workingColorSpace,e)},toWorkingColorSpace:function(n,e){return this.convert(n,e,this._workingColorSpace)},getPrimaries:function(n){return Mr[n].primaries},getTransfer:function(n){return n===Dn?Xs:Mr[n].transfer},getLuminanceCoefficients:function(n,e=this._workingColorSpace){return n.fromArray(Mr[e].luminanceCoefficients)}};function sr(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Sa(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Ni;class Rp{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Ni===void 0&&(Ni=Ys("canvas")),Ni.width=e.width,Ni.height=e.height;const i=Ni.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Ni}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ys("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=sr(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(sr(t[i]/255)*255):t[i]=sr(t[i]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Dp=0;class iu{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Dp++}),this.uuid=Yr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Ma(r[a].image)):s.push(Ma(r[a]))}else s=Ma(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function Ma(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Rp.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Lp=0;class Lt extends Ai{constructor(e=Lt.DEFAULT_IMAGE,t=Lt.DEFAULT_MAPPING,i=_t,r=_t,s=Tt,a=bi,o=Yt,l=xn,c=Lt.DEFAULT_ANISOTROPY,h=Dn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Lp++}),this.uuid=Yr(),this.name="",this.source=new iu(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ye(0,0),this.repeat=new ye(1,1),this.center=new ye(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==jh)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case dr:e.x=e.x-Math.floor(e.x);break;case _t:e.x=e.x<0?0:1;break;case wo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case dr:e.y=e.y-Math.floor(e.y);break;case _t:e.y=e.y<0?0:1;break;case wo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Lt.DEFAULT_IMAGE=null;Lt.DEFAULT_MAPPING=jh;Lt.DEFAULT_ANISOTROPY=1;class at{constructor(e=0,t=0,i=0,r=1){at.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],m=l[5],g=l[9],x=l[2],p=l[6],f=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+f-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const y=(c+1)/2,S=(m+1)/2,N=(f+1)/2,A=(h+d)/4,T=(u+x)/4,F=(g+p)/4;return y>S&&y>N?y<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(y),r=A/i,s=T/i):S>N?S<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(S),i=A/r,s=F/r):N<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(N),i=T/s,r=F/s),this.set(i,r,s,t),this}let M=Math.sqrt((p-g)*(p-g)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(M)<.001&&(M=1),this.x=(p-g)/M,this.y=(u-x)/M,this.z=(d-h)/M,this.w=Math.acos((c+m+f-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Ip extends Ai{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new at(0,0,e,t),this.scissorTest=!1,this.viewport=new at(0,0,e,t);const r={width:e,height:t,depth:1};i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Tt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},i);const s=new Lt(r,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace);s.flipY=!1,s.generateMipmaps=i.generateMipmaps,s.internalFormat=i.internalFormat,this.textures=[];const a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let i=0,r=e.textures.length;i<r;i++)this.textures[i]=e.textures[i].clone(),this.textures[i].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new iu(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class bn extends Ip{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class ru extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=ct,this.minFilter=ct,this.wrapR=_t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Up extends Lt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=ct,this.minFilter=ct,this.wrapR=_t,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Si{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],h=i[r+2],u=i[r+3];const d=s[a+0],m=s[a+1],g=s[a+2],x=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u;return}if(o===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=x;return}if(u!==x||l!==d||c!==m||h!==g){let p=1-o;const f=l*d+c*m+h*g+u*x,M=f>=0?1:-1,y=1-f*f;if(y>Number.EPSILON){const N=Math.sqrt(y),A=Math.atan2(N,f*M);p=Math.sin(p*A)/N,o=Math.sin(o*A)/N}const S=o*M;if(l=l*p+d*S,c=c*p+m*S,h=h*p+g*S,u=u*p+x*S,p===1-o){const N=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=N,c*=N,h*=N,u*=N}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],h=i[r+3],u=s[a],d=s[a+1],m=s[a+2],g=s[a+3];return e[t]=o*g+h*u+l*m-c*d,e[t+1]=l*g+h*d+c*u-o*m,e[t+2]=c*g+h*m+o*d-l*u,e[t+3]=h*g-o*u-l*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(r/2),u=o(s/2),d=l(i/2),m=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=d*h*u+c*m*g,this._y=c*m*u-d*h*g,this._z=c*h*g+d*m*u,this._w=c*h*u-d*m*g;break;case"YXZ":this._x=d*h*u+c*m*g,this._y=c*m*u-d*h*g,this._z=c*h*g-d*m*u,this._w=c*h*u+d*m*g;break;case"ZXY":this._x=d*h*u-c*m*g,this._y=c*m*u+d*h*g,this._z=c*h*g+d*m*u,this._w=c*h*u-d*m*g;break;case"ZYX":this._x=d*h*u-c*m*g,this._y=c*m*u+d*h*g,this._z=c*h*g-d*m*u,this._w=c*h*u+d*m*g;break;case"YZX":this._x=d*h*u+c*m*g,this._y=c*m*u+d*h*g,this._z=c*h*g-d*m*u,this._w=c*h*u-d*m*g;break;case"XZY":this._x=d*h*u-c*m*g,this._y=c*m*u-d*h*g,this._z=c*h*g+d*m*u,this._w=c*h*u+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=i+o+u;if(d>0){const m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(h-l)*m,this._y=(s-c)*m,this._z=(a-r)*m}else if(i>o&&i>u){const m=2*Math.sqrt(1+i-o-u);this._w=(h-l)/m,this._x=.25*m,this._y=(r+a)/m,this._z=(s+c)/m}else if(o>u){const m=2*Math.sqrt(1+o-i-u);this._w=(s-c)/m,this._x=(r+a)/m,this._y=.25*m,this._z=(l+h)/m}else{const m=2*Math.sqrt(1+u-i-o);this._w=(a-r)/m,this._x=(s+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Dt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-i*c,this._z=s*h+a*c+i*l-r*o,this._w=a*h-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const i=this._x,r=this._y,s=this._z,a=this._w;let o=a*e._w+i*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=i,this._y=r,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const m=1-t;return this._w=m*a+t*this._w,this._x=m*i+t*this._x,this._y=m*r+t*this._y,this._z=m*s+t*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=i*u+this._x*d,this._y=r*u+this._y*d,this._z=s*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class L{constructor(e=0,t=0,i=0){L.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(uc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(uc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),h=2*(o*t-s*r),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*h,this.y=i+l*h+o*c-s*u,this.z=r+l*u+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ea.copy(this).projectOnVector(e),this.sub(Ea)}reflect(e){return this.sub(Ea.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Dt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Ea=new L,uc=new Si;class Pi{constructor(e=new L(1/0,1/0,1/0),t=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(cn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(cn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=cn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,cn):cn.fromBufferAttribute(s,a),cn.applyMatrix4(e.matrixWorld),this.expandByPoint(cn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),us.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),us.copy(i.boundingBox)),us.applyMatrix4(e.matrixWorld),this.union(us)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,cn),cn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Er),ds.subVectors(this.max,Er),Fi.subVectors(e.a,Er),Oi.subVectors(e.b,Er),ki.subVectors(e.c,Er),Gn.subVectors(Oi,Fi),Wn.subVectors(ki,Oi),oi.subVectors(Fi,ki);let t=[0,-Gn.z,Gn.y,0,-Wn.z,Wn.y,0,-oi.z,oi.y,Gn.z,0,-Gn.x,Wn.z,0,-Wn.x,oi.z,0,-oi.x,-Gn.y,Gn.x,0,-Wn.y,Wn.x,0,-oi.y,oi.x,0];return!Ta(t,Fi,Oi,ki,ds)||(t=[1,0,0,0,1,0,0,0,1],!Ta(t,Fi,Oi,ki,ds))?!1:(ps.crossVectors(Gn,Wn),t=[ps.x,ps.y,ps.z],Ta(t,Fi,Oi,ki,ds))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,cn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(cn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Mn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Mn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Mn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Mn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Mn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Mn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Mn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Mn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Mn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Mn=[new L,new L,new L,new L,new L,new L,new L,new L],cn=new L,us=new Pi,Fi=new L,Oi=new L,ki=new L,Gn=new L,Wn=new L,oi=new L,Er=new L,ds=new L,ps=new L,li=new L;function Ta(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){li.fromArray(n,s);const o=r.x*Math.abs(li.x)+r.y*Math.abs(li.y)+r.z*Math.abs(li.z),l=e.dot(li),c=t.dot(li),h=i.dot(li);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Np=new Pi,Tr=new L,Ca=new L;class gr{constructor(e=new L,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Np.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Tr.subVectors(e,this.center);const t=Tr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Tr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ca.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Tr.copy(e.center).add(Ca)),this.expandByPoint(Tr.copy(e.center).sub(Ca))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const En=new L,Aa=new L,fs=new L,Xn=new L,Pa=new L,ms=new L,Ra=new L;class pl{constructor(e=new L,t=new L(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,En)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=En.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(En.copy(this.origin).addScaledVector(this.direction,t),En.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Aa.copy(e).add(t).multiplyScalar(.5),fs.copy(t).sub(e).normalize(),Xn.copy(this.origin).sub(Aa);const s=e.distanceTo(t)*.5,a=-this.direction.dot(fs),o=Xn.dot(this.direction),l=-Xn.dot(fs),c=Xn.lengthSq(),h=Math.abs(1-a*a);let u,d,m,g;if(h>0)if(u=a*l-o,d=a*o-l,g=s*h,u>=0)if(d>=-g)if(d<=g){const x=1/h;u*=x,d*=x,m=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=s,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+c;else d=-s,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-a*s+o)),d=u>0?-s:Math.min(Math.max(-s,-l),s),m=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-s,-l),s),m=d*(d+2*l)+c):(u=Math.max(0,-(a*s+o)),d=u>0?s:Math.min(Math.max(-s,-l),s),m=-u*u+d*(d+2*l)+c);else d=a>0?-s:s,u=Math.max(0,-(a*d+o)),m=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Aa).addScaledVector(fs,d),m}intersectSphere(e,t){En.subVectors(e.center,this.origin);const i=En.dot(this.direction),r=En.dot(En)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(i=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),h>=0?(s=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(s=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,En)!==null}intersectTriangle(e,t,i,r,s){Pa.subVectors(t,e),ms.subVectors(i,e),Ra.crossVectors(Pa,ms);let a=this.direction.dot(Ra),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Xn.subVectors(this.origin,e);const l=o*this.direction.dot(ms.crossVectors(Xn,ms));if(l<0)return null;const c=o*this.direction.dot(Pa.cross(Xn));if(c<0||l+c>a)return null;const h=-o*Xn.dot(Ra);return h<0?null:this.at(h/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class $e{constructor(e,t,i,r,s,a,o,l,c,h,u,d,m,g,x,p){$e.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,h,u,d,m,g,x,p)}set(e,t,i,r,s,a,o,l,c,h,u,d,m,g,x,p){const f=this.elements;return f[0]=e,f[4]=t,f[8]=i,f[12]=r,f[1]=s,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=h,f[10]=u,f[14]=d,f[3]=m,f[7]=g,f[11]=x,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new $e().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,i=e.elements,r=1/Bi.setFromMatrixColumn(e,0).length(),s=1/Bi.setFromMatrixColumn(e,1).length(),a=1/Bi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){const d=a*h,m=a*u,g=o*h,x=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=m+g*c,t[5]=d-x*c,t[9]=-o*l,t[2]=x-d*c,t[6]=g+m*c,t[10]=a*l}else if(e.order==="YXZ"){const d=l*h,m=l*u,g=c*h,x=c*u;t[0]=d+x*o,t[4]=g*o-m,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=m*o-g,t[6]=x+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*h,m=l*u,g=c*h,x=c*u;t[0]=d-x*o,t[4]=-a*u,t[8]=g+m*o,t[1]=m+g*o,t[5]=a*h,t[9]=x-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*h,m=a*u,g=o*h,x=o*u;t[0]=l*h,t[4]=g*c-m,t[8]=d*c+x,t[1]=l*u,t[5]=x*c+d,t[9]=m*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,m=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=x-d*u,t[8]=g*u+m,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=m*u+g,t[10]=d-x*u}else if(e.order==="XZY"){const d=a*l,m=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+x,t[5]=a*h,t[9]=m*u-g,t[2]=g*u-m,t[6]=o*h,t[10]=x*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Fp,e,Op)}lookAt(e,t,i){const r=this.elements;return jt.subVectors(e,t),jt.lengthSq()===0&&(jt.z=1),jt.normalize(),jn.crossVectors(i,jt),jn.lengthSq()===0&&(Math.abs(i.z)===1?jt.x+=1e-4:jt.z+=1e-4,jt.normalize(),jn.crossVectors(i,jt)),jn.normalize(),vs.crossVectors(jt,jn),r[0]=jn.x,r[4]=vs.x,r[8]=jt.x,r[1]=jn.y,r[5]=vs.y,r[9]=jt.y,r[2]=jn.z,r[6]=vs.z,r[10]=jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],m=i[13],g=i[2],x=i[6],p=i[10],f=i[14],M=i[3],y=i[7],S=i[11],N=i[15],A=r[0],T=r[4],F=r[8],K=r[12],v=r[1],w=r[5],H=r[9],G=r[13],X=r[2],z=r[6],C=r[10],V=r[14],U=r[3],ee=r[7],Q=r[11],Z=r[15];return s[0]=a*A+o*v+l*X+c*U,s[4]=a*T+o*w+l*z+c*ee,s[8]=a*F+o*H+l*C+c*Q,s[12]=a*K+o*G+l*V+c*Z,s[1]=h*A+u*v+d*X+m*U,s[5]=h*T+u*w+d*z+m*ee,s[9]=h*F+u*H+d*C+m*Q,s[13]=h*K+u*G+d*V+m*Z,s[2]=g*A+x*v+p*X+f*U,s[6]=g*T+x*w+p*z+f*ee,s[10]=g*F+x*H+p*C+f*Q,s[14]=g*K+x*G+p*V+f*Z,s[3]=M*A+y*v+S*X+N*U,s[7]=M*T+y*w+S*z+N*ee,s[11]=M*F+y*H+S*C+N*Q,s[15]=M*K+y*G+S*V+N*Z,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],m=e[14],g=e[3],x=e[7],p=e[11],f=e[15];return g*(+s*l*u-r*c*u-s*o*d+i*c*d+r*o*m-i*l*m)+x*(+t*l*m-t*c*d+s*a*d-r*a*m+r*c*h-s*l*h)+p*(+t*c*u-t*o*m-s*a*u+i*a*m+s*o*h-i*c*h)+f*(-r*o*h-t*l*u+t*o*d+r*a*u-i*a*d+i*l*h)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],m=e[11],g=e[12],x=e[13],p=e[14],f=e[15],M=u*p*c-x*d*c+x*l*m-o*p*m-u*l*f+o*d*f,y=g*d*c-h*p*c-g*l*m+a*p*m+h*l*f-a*d*f,S=h*x*c-g*u*c+g*o*m-a*x*m-h*o*f+a*u*f,N=g*u*l-h*x*l-g*o*d+a*x*d+h*o*p-a*u*p,A=t*M+i*y+r*S+s*N;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/A;return e[0]=M*T,e[1]=(x*d*s-u*p*s-x*r*m+i*p*m+u*r*f-i*d*f)*T,e[2]=(o*p*s-x*l*s+x*r*c-i*p*c-o*r*f+i*l*f)*T,e[3]=(u*l*s-o*d*s-u*r*c+i*d*c+o*r*m-i*l*m)*T,e[4]=y*T,e[5]=(h*p*s-g*d*s+g*r*m-t*p*m-h*r*f+t*d*f)*T,e[6]=(g*l*s-a*p*s-g*r*c+t*p*c+a*r*f-t*l*f)*T,e[7]=(a*d*s-h*l*s+h*r*c-t*d*c-a*r*m+t*l*m)*T,e[8]=S*T,e[9]=(g*u*s-h*x*s-g*i*m+t*x*m+h*i*f-t*u*f)*T,e[10]=(a*x*s-g*o*s+g*i*c-t*x*c-a*i*f+t*o*f)*T,e[11]=(h*o*s-a*u*s-h*i*c+t*u*c+a*i*m-t*o*m)*T,e[12]=N*T,e[13]=(h*x*r-g*u*r+g*i*d-t*x*d-h*i*p+t*u*p)*T,e[14]=(g*o*r-a*x*r-g*i*l+t*x*l+a*i*p-t*o*p)*T,e[15]=(a*u*r-h*o*r+h*i*l-t*u*l-a*i*d+t*o*d)*T,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+i,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,h=a+a,u=o+o,d=s*c,m=s*h,g=s*u,x=a*h,p=a*u,f=o*u,M=l*c,y=l*h,S=l*u,N=i.x,A=i.y,T=i.z;return r[0]=(1-(x+f))*N,r[1]=(m+S)*N,r[2]=(g-y)*N,r[3]=0,r[4]=(m-S)*A,r[5]=(1-(d+f))*A,r[6]=(p+M)*A,r[7]=0,r[8]=(g+y)*T,r[9]=(p-M)*T,r[10]=(1-(d+x))*T,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;let s=Bi.set(r[0],r[1],r[2]).length();const a=Bi.set(r[4],r[5],r[6]).length(),o=Bi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],hn.copy(this);const c=1/s,h=1/a,u=1/o;return hn.elements[0]*=c,hn.elements[1]*=c,hn.elements[2]*=c,hn.elements[4]*=h,hn.elements[5]*=h,hn.elements[6]*=h,hn.elements[8]*=u,hn.elements[9]*=u,hn.elements[10]*=u,t.setFromRotationMatrix(hn),i.x=s,i.y=a,i.z=o,this}makePerspective(e,t,i,r,s,a,o=In){const l=this.elements,c=2*s/(t-e),h=2*s/(i-r),u=(t+e)/(t-e),d=(i+r)/(i-r);let m,g;if(o===In)m=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===qs)m=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=In){const l=this.elements,c=1/(t-e),h=1/(i-r),u=1/(a-s),d=(t+e)*c,m=(i+r)*h;let g,x;if(o===In)g=(a+s)*u,x=-2*u;else if(o===qs)g=s*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const Bi=new L,hn=new $e,Fp=new L(0,0,0),Op=new L(1,1,1),jn=new L,vs=new L,jt=new L,dc=new $e,pc=new Si;class kn{constructor(e=0,t=0,i=0,r=kn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],u=r[2],d=r[6],m=r[10];switch(t){case"XYZ":this._y=Math.asin(Dt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Dt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(Dt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Dt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Dt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Dt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return dc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(dc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return pc.setFromEuler(this),this.setFromQuaternion(pc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}kn.DEFAULT_ORDER="XYZ";class fl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let kp=0;const fc=new L,zi=new Si,Tn=new $e,gs=new L,Cr=new L,Bp=new L,zp=new Si,mc=new L(1,0,0),vc=new L(0,1,0),gc=new L(0,0,1),_c={type:"added"},Vp={type:"removed"},Vi={type:"childadded",child:null},Da={type:"childremoved",child:null};class Mt extends Ai{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kp++}),this.uuid=Yr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Mt.DEFAULT_UP.clone();const e=new L,t=new kn,i=new Si,r=new L(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new $e},normalMatrix:{value:new Ue}}),this.matrix=new $e,this.matrixWorld=new $e,this.matrixAutoUpdate=Mt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new fl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return zi.setFromAxisAngle(e,t),this.quaternion.multiply(zi),this}rotateOnWorldAxis(e,t){return zi.setFromAxisAngle(e,t),this.quaternion.premultiply(zi),this}rotateX(e){return this.rotateOnAxis(mc,e)}rotateY(e){return this.rotateOnAxis(vc,e)}rotateZ(e){return this.rotateOnAxis(gc,e)}translateOnAxis(e,t){return fc.copy(e).applyQuaternion(this.quaternion),this.position.add(fc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(mc,e)}translateY(e){return this.translateOnAxis(vc,e)}translateZ(e){return this.translateOnAxis(gc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Tn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?gs.copy(e):gs.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Cr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Tn.lookAt(Cr,gs,this.up):Tn.lookAt(gs,Cr,this.up),this.quaternion.setFromRotationMatrix(Tn),r&&(Tn.extractRotation(r.matrixWorld),zi.setFromRotationMatrix(Tn),this.quaternion.premultiply(zi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(_c),Vi.child=e,this.dispatchEvent(Vi),Vi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Vp),Da.child=e,this.dispatchEvent(Da),Da.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Tn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Tn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Tn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(_c),Vi.child=e,this.dispatchEvent(Vi),Vi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,e,Bp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cr,zp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),m=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),m.length>0&&(i.animations=m),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Mt.DEFAULT_UP=new L(0,1,0);Mt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Mt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const un=new L,Cn=new L,La=new L,An=new L,Hi=new L,Gi=new L,xc=new L,Ia=new L,Ua=new L,Na=new L,Fa=new at,Oa=new at,ka=new at;class fn{constructor(e=new L,t=new L,i=new L){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),un.subVectors(e,t),r.cross(un);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){un.subVectors(r,t),Cn.subVectors(i,t),La.subVectors(e,t);const a=un.dot(un),o=un.dot(Cn),l=un.dot(La),c=Cn.dot(Cn),h=Cn.dot(La),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;const d=1/u,m=(c*l-o*h)*d,g=(a*h-o*l)*d;return s.set(1-m-g,g,m)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,An)===null?!1:An.x>=0&&An.y>=0&&An.x+An.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,An)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,An.x),l.addScaledVector(a,An.y),l.addScaledVector(o,An.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return Fa.setScalar(0),Oa.setScalar(0),ka.setScalar(0),Fa.fromBufferAttribute(e,t),Oa.fromBufferAttribute(e,i),ka.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Fa,s.x),a.addScaledVector(Oa,s.y),a.addScaledVector(ka,s.z),a}static isFrontFacing(e,t,i,r){return un.subVectors(i,t),Cn.subVectors(e,t),un.cross(Cn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return un.subVectors(this.c,this.b),Cn.subVectors(this.a,this.b),un.cross(Cn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return fn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return fn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return fn.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return fn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return fn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;Hi.subVectors(r,i),Gi.subVectors(s,i),Ia.subVectors(e,i);const l=Hi.dot(Ia),c=Gi.dot(Ia);if(l<=0&&c<=0)return t.copy(i);Ua.subVectors(e,r);const h=Hi.dot(Ua),u=Gi.dot(Ua);if(h>=0&&u<=h)return t.copy(r);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(i).addScaledVector(Hi,a);Na.subVectors(e,s);const m=Hi.dot(Na),g=Gi.dot(Na);if(g>=0&&m<=g)return t.copy(s);const x=m*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(Gi,o);const p=h*g-m*u;if(p<=0&&u-h>=0&&m-g>=0)return xc.subVectors(s,r),o=(u-h)/(u-h+(m-g)),t.copy(r).addScaledVector(xc,o);const f=1/(p+x+d);return a=x*f,o=d*f,t.copy(i).addScaledVector(Hi,a).addScaledVector(Gi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const su={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Kn={h:0,s:0,l:0},_s={h:0,s:0,l:0};function Ba(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class we{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=dn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,qe.toWorkingColorSpace(this,t),this}setRGB(e,t,i,r=qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,qe.toWorkingColorSpace(this,r),this}setHSL(e,t,i,r=qe.workingColorSpace){if(e=Sp(e,1),t=Dt(t,0,1),i=Dt(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=Ba(a,s,e+1/3),this.g=Ba(a,s,e),this.b=Ba(a,s,e-1/3)}return qe.toWorkingColorSpace(this,r),this}setStyle(e,t=dn){function i(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=dn){const i=su[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=sr(e.r),this.g=sr(e.g),this.b=sr(e.b),this}copyLinearToSRGB(e){return this.r=Sa(e.r),this.g=Sa(e.g),this.b=Sa(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=dn){return qe.fromWorkingColorSpace(Pt.copy(this),e),Math.round(Dt(Pt.r*255,0,255))*65536+Math.round(Dt(Pt.g*255,0,255))*256+Math.round(Dt(Pt.b*255,0,255))}getHexString(e=dn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.fromWorkingColorSpace(Pt.copy(this),t);const i=Pt.r,r=Pt.g,s=Pt.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case i:l=(r-s)/u+(r<s?6:0);break;case r:l=(s-i)/u+2;break;case s:l=(i-r)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=qe.workingColorSpace){return qe.fromWorkingColorSpace(Pt.copy(this),t),e.r=Pt.r,e.g=Pt.g,e.b=Pt.b,e}getStyle(e=dn){qe.fromWorkingColorSpace(Pt.copy(this),e);const t=Pt.r,i=Pt.g,r=Pt.b;return e!==dn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Kn),this.setHSL(Kn.h+e,Kn.s+t,Kn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Kn),e.getHSL(_s);const i=ya(Kn.h,_s.h,t),r=ya(Kn.s,_s.s,t),s=ya(Kn.l,_s.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Pt=new we;we.NAMES=su;let Hp=0;class ra extends Ai{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Hp++}),this.uuid=Yr(),this.name="",this.type="Material",this.blending=yi,this.side=ni,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=uo,this.blendDst=Br,this.blendEquation=_i,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new we(0,0,0),this.blendAlpha=0,this.depthFunc=cr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ac,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ui,this.stencilZFail=Ui,this.stencilZPass=Ui,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==yi&&(i.blending=this.blending),this.side!==ni&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==uo&&(i.blendSrc=this.blendSrc),this.blendDst!==Br&&(i.blendDst=this.blendDst),this.blendEquation!==_i&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==cr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ac&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ui&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Ui&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Ui&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class au extends ra{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new we(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new kn,this.combine=Wh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ft=new L,xs=new ye;class St{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=oc,this.updateRanges=[],this.gpuType=mn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)xs.fromBufferAttribute(this,t),xs.applyMatrix3(e),this.setXY(t,xs.x,xs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix3(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix4(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)ft.fromBufferAttribute(this,t),ft.applyNormalMatrix(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)ft.fromBufferAttribute(this,t),ft.transformDirection(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Sr(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Ot(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Sr(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ot(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Sr(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ot(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Sr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ot(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Sr(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ot(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Ot(t,this.array),i=Ot(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Ot(t,this.array),i=Ot(i,this.array),r=Ot(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Ot(t,this.array),i=Ot(i,this.array),r=Ot(r,this.array),s=Ot(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==oc&&(e.usage=this.usage),e}}class ou extends St{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class lu extends St{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class on extends St{constructor(e,t,i){super(new Float32Array(e),t,i)}}let Gp=0;const tn=new $e,za=new Mt,Wi=new L,Kt=new Pi,Ar=new Pi,wt=new L;class Zt extends Ai{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Gp++}),this.uuid=Yr(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(nu(e)?lu:ou)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new Ue().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return tn.makeRotationFromQuaternion(e),this.applyMatrix4(tn),this}rotateX(e){return tn.makeRotationX(e),this.applyMatrix4(tn),this}rotateY(e){return tn.makeRotationY(e),this.applyMatrix4(tn),this}rotateZ(e){return tn.makeRotationZ(e),this.applyMatrix4(tn),this}translate(e,t,i){return tn.makeTranslation(e,t,i),this.applyMatrix4(tn),this}scale(e,t,i){return tn.makeScale(e,t,i),this.applyMatrix4(tn),this}lookAt(e){return za.lookAt(e),za.updateMatrix(),this.applyMatrix4(za.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wi).negate(),this.translate(Wi.x,Wi.y,Wi.z),this}setFromPoints(e){const t=[];for(let i=0,r=e.length;i<r;i++){const s=e[i];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new on(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Pi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Kt.setFromBufferAttribute(s),this.morphTargetsRelative?(wt.addVectors(this.boundingBox.min,Kt.min),this.boundingBox.expandByPoint(wt),wt.addVectors(this.boundingBox.max,Kt.max),this.boundingBox.expandByPoint(wt)):(this.boundingBox.expandByPoint(Kt.min),this.boundingBox.expandByPoint(Kt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new gr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(e){const i=this.boundingSphere.center;if(Kt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];Ar.setFromBufferAttribute(o),this.morphTargetsRelative?(wt.addVectors(Kt.min,Ar.min),Kt.expandByPoint(wt),wt.addVectors(Kt.max,Ar.max),Kt.expandByPoint(wt)):(Kt.expandByPoint(Ar.min),Kt.expandByPoint(Ar.max))}Kt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)wt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(wt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)wt.fromBufferAttribute(o,c),l&&(Wi.fromBufferAttribute(e,c),wt.add(Wi)),r=Math.max(r,i.distanceToSquared(wt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new St(new Float32Array(4*i.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let F=0;F<i.count;F++)o[F]=new L,l[F]=new L;const c=new L,h=new L,u=new L,d=new ye,m=new ye,g=new ye,x=new L,p=new L;function f(F,K,v){c.fromBufferAttribute(i,F),h.fromBufferAttribute(i,K),u.fromBufferAttribute(i,v),d.fromBufferAttribute(s,F),m.fromBufferAttribute(s,K),g.fromBufferAttribute(s,v),h.sub(c),u.sub(c),m.sub(d),g.sub(d);const w=1/(m.x*g.y-g.x*m.y);isFinite(w)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(u,-m.y).multiplyScalar(w),p.copy(u).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(w),o[F].add(x),o[K].add(x),o[v].add(x),l[F].add(p),l[K].add(p),l[v].add(p))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let F=0,K=M.length;F<K;++F){const v=M[F],w=v.start,H=v.count;for(let G=w,X=w+H;G<X;G+=3)f(e.getX(G+0),e.getX(G+1),e.getX(G+2))}const y=new L,S=new L,N=new L,A=new L;function T(F){N.fromBufferAttribute(r,F),A.copy(N);const K=o[F];y.copy(K),y.sub(N.multiplyScalar(N.dot(K))).normalize(),S.crossVectors(A,K);const w=S.dot(l[F])<0?-1:1;a.setXYZW(F,y.x,y.y,y.z,w)}for(let F=0,K=M.length;F<K;++F){const v=M[F],w=v.start,H=v.count;for(let G=w,X=w+H;G<X;G+=3)T(e.getX(G+0)),T(e.getX(G+1)),T(e.getX(G+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new St(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,m=i.count;d<m;d++)i.setXYZ(d,0,0,0);const r=new L,s=new L,a=new L,o=new L,l=new L,c=new L,h=new L,u=new L;if(e)for(let d=0,m=e.count;d<m;d+=3){const g=e.getX(d+0),x=e.getX(d+1),p=e.getX(d+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,x),a.fromBufferAttribute(t,p),h.subVectors(a,s),u.subVectors(r,s),h.cross(u),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,x),c.fromBufferAttribute(i,p),o.add(h),l.add(h),c.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(x,l.x,l.y,l.z),i.setXYZ(p,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,s),u.subVectors(r,s),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)wt.fromBufferAttribute(e,t),wt.normalize(),e.setXYZ(t,wt.x,wt.y,wt.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h);let m=0,g=0;for(let x=0,p=l.length;x<p;x++){o.isInterleavedBufferAttribute?m=l[x]*o.data.stride+o.offset:m=l[x]*h;for(let f=0;f<h;f++)d[g++]=c[m++]}return new St(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Zt,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,u=c.length;h<u;h++){const d=c[h],m=e(d,i);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const m=c[u];h.push(m.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone(t));const r=e.attributes;for(const c in r){const h=r[c];this.setAttribute(c,h.clone(t))}const s=e.morphAttributes;for(const c in s){const h=[],u=s[c];for(let d=0,m=u.length;d<m;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const bc=new $e,ci=new pl,bs=new gr,yc=new L,ys=new L,ws=new L,Ss=new L,Va=new L,Ms=new L,wc=new L,Es=new L;class ut extends Mt{constructor(e=new Zt,t=new au){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Ms.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],u=s[l];h!==0&&(Va.fromBufferAttribute(u,e),a?Ms.addScaledVector(Va,h):Ms.addScaledVector(Va.sub(t),h))}t.add(Ms)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),bs.copy(i.boundingSphere),bs.applyMatrix4(s),ci.copy(e.ray).recast(e.near),!(bs.containsPoint(ci.origin)===!1&&(ci.intersectSphere(bs,yc)===null||ci.origin.distanceToSquared(yc)>(e.far-e.near)**2))&&(bc.copy(s).invert(),ci.copy(e.ray).applyMatrix4(bc),!(i.boundingBox!==null&&ci.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,ci)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,m=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){const p=d[g],f=a[p.materialIndex],M=Math.max(p.start,m.start),y=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let S=M,N=y;S<N;S+=3){const A=o.getX(S),T=o.getX(S+1),F=o.getX(S+2);r=Ts(this,f,e,i,c,h,u,A,T,F),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),x=Math.min(o.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){const M=o.getX(p),y=o.getX(p+1),S=o.getX(p+2);r=Ts(this,a,e,i,c,h,u,M,y,S),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){const p=d[g],f=a[p.materialIndex],M=Math.max(p.start,m.start),y=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let S=M,N=y;S<N;S+=3){const A=S,T=S+1,F=S+2;r=Ts(this,f,e,i,c,h,u,A,T,F),r&&(r.faceIndex=Math.floor(S/3),r.face.materialIndex=p.materialIndex,t.push(r))}}else{const g=Math.max(0,m.start),x=Math.min(l.count,m.start+m.count);for(let p=g,f=x;p<f;p+=3){const M=p,y=p+1,S=p+2;r=Ts(this,a,e,i,c,h,u,M,y,S),r&&(r.faceIndex=Math.floor(p/3),t.push(r))}}}}function Wp(n,e,t,i,r,s,a,o){let l;if(e.side===zt?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===ni,o),l===null)return null;Es.copy(o),Es.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Es);return c<t.near||c>t.far?null:{distance:c,point:Es.clone(),object:n}}function Ts(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,ys),n.getVertexPosition(l,ws),n.getVertexPosition(c,Ss);const h=Wp(n,e,t,i,ys,ws,Ss,wc);if(h){const u=new L;fn.getBarycoord(wc,ys,ws,Ss,u),r&&(h.uv=fn.getInterpolatedAttribute(r,o,l,c,u,new ye)),s&&(h.uv1=fn.getInterpolatedAttribute(s,o,l,c,u,new ye)),a&&(h.normal=fn.getInterpolatedAttribute(a,o,l,c,u,new L),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new L,materialIndex:0};fn.getNormal(ys,ws,Ss,d.normal),h.face=d,h.barycoord=u}return h}class $r extends Zt{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],u=[];let d=0,m=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new on(c,3)),this.setAttribute("normal",new on(h,3)),this.setAttribute("uv",new on(u,2));function g(x,p,f,M,y,S,N,A,T,F,K){const v=S/T,w=N/F,H=S/2,G=N/2,X=A/2,z=T+1,C=F+1;let V=0,U=0;const ee=new L;for(let Q=0;Q<C;Q++){const Z=Q*w-G;for(let ge=0;ge<z;ge++){const Pe=ge*v-H;ee[x]=Pe*M,ee[p]=Z*y,ee[f]=X,c.push(ee.x,ee.y,ee.z),ee[x]=0,ee[p]=0,ee[f]=A>0?1:-1,h.push(ee.x,ee.y,ee.z),u.push(ge/T),u.push(1-Q/F),V+=1}}for(let Q=0;Q<F;Q++)for(let Z=0;Z<T;Z++){const ge=d+Z+z*Q,Pe=d+Z+z*(Q+1),j=d+(Z+1)+z*(Q+1),te=d+(Z+1)+z*Q;l.push(ge,Pe,te),l.push(Pe,j,te),U+=6}o.addGroup(m,U,K),m+=U,d+=V}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new $r(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function mr(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function Rt(n){const e={};for(let t=0;t<n.length;t++){const i=mr(n[t]);for(const r in i)e[r]=i[r]}return e}function Xp(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function cu(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:qe.workingColorSpace}const hu={clone:mr,merge:Rt};var jp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Kp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class mt extends ra{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=jp,this.fragmentShader=Kp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=mr(e.uniforms),this.uniformsGroups=Xp(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class uu extends Mt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new $e,this.projectionMatrix=new $e,this.projectionMatrixInverse=new $e,this.coordinateSystem=In}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const qn=new L,Sc=new ye,Mc=new ye;class rn extends uu{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Yo*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(zs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Yo*2*Math.atan(Math.tan(zs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(qn.x,qn.y).multiplyScalar(-e/qn.z),qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(qn.x,qn.y).multiplyScalar(-e/qn.z)}getViewSize(e,t){return this.getViewBounds(e,Sc,Mc),t.subVectors(Mc,Sc)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(zs*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Xi=-90,ji=1;class qp extends Mt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new rn(Xi,ji,e,t);r.layers=this.layers,this.add(r);const s=new rn(Xi,ji,e,t);s.layers=this.layers,this.add(s);const a=new rn(Xi,ji,e,t);a.layers=this.layers,this.add(a);const o=new rn(Xi,ji,e,t);o.layers=this.layers,this.add(o);const l=new rn(Xi,ji,e,t);l.layers=this.layers,this.add(l);const c=new rn(Xi,ji,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===In)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qs)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,r),e.render(t,s),e.setRenderTarget(i,1,r),e.render(t,a),e.setRenderTarget(i,2,r),e.render(t,o),e.setRenderTarget(i,3,r),e.render(t,l),e.setRenderTarget(i,4,r),e.render(t,c),i.texture.generateMipmaps=x,e.setRenderTarget(i,5,r),e.render(t,h),e.setRenderTarget(u,d,m),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class du extends Lt{constructor(e,t,i,r,s,a,o,l,c,h){e=e!==void 0?e:[],t=t!==void 0?t:hr,super(e,t,i,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Yp extends bn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new du(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Tt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new $r(5,5,5),s=new mt({name:"CubemapFromEquirect",uniforms:mr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:zt,blending:Fn});s.uniforms.tEquirect.value=t;const a=new ut(r,s),o=t.minFilter;return t.minFilter===bi&&(t.minFilter=Tt),new qp(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,i,r){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}const Ha=new L,$p=new L,Zp=new Ue;class Jn{constructor(e=new L(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=Ha.subVectors(i,t).cross($p.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(Ha),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||Zp.getNormalMatrix(e),r=this.coplanarPoint(Ha).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const hi=new gr,Cs=new L;class ml{constructor(e=new Jn,t=new Jn,i=new Jn,r=new Jn,s=new Jn,a=new Jn){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=In){const i=this.planes,r=e.elements,s=r[0],a=r[1],o=r[2],l=r[3],c=r[4],h=r[5],u=r[6],d=r[7],m=r[8],g=r[9],x=r[10],p=r[11],f=r[12],M=r[13],y=r[14],S=r[15];if(i[0].setComponents(l-s,d-c,p-m,S-f).normalize(),i[1].setComponents(l+s,d+c,p+m,S+f).normalize(),i[2].setComponents(l+a,d+h,p+g,S+M).normalize(),i[3].setComponents(l-a,d-h,p-g,S-M).normalize(),i[4].setComponents(l-o,d-u,p-x,S-y).normalize(),t===In)i[5].setComponents(l+o,d+u,p+x,S+y).normalize();else if(t===qs)i[5].setComponents(o,u,x,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),hi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),hi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(hi)}intersectsSprite(e){return hi.center.set(0,0,0),hi.radius=.7071067811865476,hi.applyMatrix4(e.matrixWorld),this.intersectsSphere(hi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Cs.x=r.normal.x>0?e.max.x:e.min.x,Cs.y=r.normal.y>0?e.max.y:e.min.y,Cs.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Cs)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function pu(){let n=null,e=!1,t=null,i=null;function r(s,a){t(s,a),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function Jp(n){const e=new WeakMap;function t(o,l){const c=o.array,h=o.usage,u=c.byteLength,d=n.createBuffer();n.bindBuffer(l,d),n.bufferData(l,c,h),o.onUploadCallback();let m;if(c instanceof Float32Array)m=n.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=n.SHORT;else if(c instanceof Uint32Array)m=n.UNSIGNED_INT;else if(c instanceof Int32Array)m=n.INT;else if(c instanceof Int8Array)m=n.BYTE;else if(c instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){const h=l.array,u=l.updateRanges;if(n.bindBuffer(c,o),u.length===0)n.bufferSubData(c,0,h);else{u.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<u.length;m++){const g=u[d],x=u[m];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let m=0,g=u.length;m<g;m++){const x=u[m];n.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}class _n extends Zt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,h=l+1,u=e/o,d=t/l,m=[],g=[],x=[],p=[];for(let f=0;f<h;f++){const M=f*d-a;for(let y=0;y<c;y++){const S=y*u-s;g.push(S,-M,0),x.push(0,0,1),p.push(y/o),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let M=0;M<o;M++){const y=M+c*f,S=M+c*(f+1),N=M+1+c*(f+1),A=M+1+c*f;m.push(y,S,A),m.push(S,N,A)}this.setIndex(m),this.setAttribute("position",new on(g,3)),this.setAttribute("normal",new on(x,3)),this.setAttribute("uv",new on(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new _n(e.width,e.height,e.widthSegments,e.heightSegments)}}var Qp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ef=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,tf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,nf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,rf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,sf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,af=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,of=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,lf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,cf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,hf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,uf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,df=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,pf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ff=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,vf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_f=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,xf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,bf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,yf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,wf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Sf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Mf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ef=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Tf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Cf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Af=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Pf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Rf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Df=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Lf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,If=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Uf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Nf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ff=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Of=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,kf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Vf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Hf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Gf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Wf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,jf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Kf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,qf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,$f=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Jf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Qf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,em=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,tm=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,nm=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,im=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rm=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sm=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,am=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,om=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,lm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,cm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,um=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,dm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,pm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,fm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,vm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,gm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,_m=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,xm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,bm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,ym=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,wm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Sm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Mm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Em=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Tm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Cm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Am=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Pm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Rm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Dm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Lm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Im=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Um=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Nm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Fm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Om=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,km=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Bm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,zm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Vm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Hm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Gm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Wm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Xm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,jm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Km=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,qm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Ym=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,$m=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Jm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Qm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,ev=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,nv=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,iv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,rv=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,av=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ov=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,lv=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,cv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,hv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,dv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,pv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,fv=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mv=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vv=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gv=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,_v=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xv=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,bv=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,yv=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,wv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sv=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Mv=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ev=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Tv=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cv=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Av=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Pv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Dv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Lv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ie={alphahash_fragment:Qp,alphahash_pars_fragment:ef,alphamap_fragment:tf,alphamap_pars_fragment:nf,alphatest_fragment:rf,alphatest_pars_fragment:sf,aomap_fragment:af,aomap_pars_fragment:of,batching_pars_vertex:lf,batching_vertex:cf,begin_vertex:hf,beginnormal_vertex:uf,bsdfs:df,iridescence_fragment:pf,bumpmap_pars_fragment:ff,clipping_planes_fragment:mf,clipping_planes_pars_fragment:vf,clipping_planes_pars_vertex:gf,clipping_planes_vertex:_f,color_fragment:xf,color_pars_fragment:bf,color_pars_vertex:yf,color_vertex:wf,common:Sf,cube_uv_reflection_fragment:Mf,defaultnormal_vertex:Ef,displacementmap_pars_vertex:Tf,displacementmap_vertex:Cf,emissivemap_fragment:Af,emissivemap_pars_fragment:Pf,colorspace_fragment:Rf,colorspace_pars_fragment:Df,envmap_fragment:Lf,envmap_common_pars_fragment:If,envmap_pars_fragment:Uf,envmap_pars_vertex:Nf,envmap_physical_pars_fragment:jf,envmap_vertex:Ff,fog_vertex:Of,fog_pars_vertex:kf,fog_fragment:Bf,fog_pars_fragment:zf,gradientmap_pars_fragment:Vf,lightmap_pars_fragment:Hf,lights_lambert_fragment:Gf,lights_lambert_pars_fragment:Wf,lights_pars_begin:Xf,lights_toon_fragment:Kf,lights_toon_pars_fragment:qf,lights_phong_fragment:Yf,lights_phong_pars_fragment:$f,lights_physical_fragment:Zf,lights_physical_pars_fragment:Jf,lights_fragment_begin:Qf,lights_fragment_maps:em,lights_fragment_end:tm,logdepthbuf_fragment:nm,logdepthbuf_pars_fragment:im,logdepthbuf_pars_vertex:rm,logdepthbuf_vertex:sm,map_fragment:am,map_pars_fragment:om,map_particle_fragment:lm,map_particle_pars_fragment:cm,metalnessmap_fragment:hm,metalnessmap_pars_fragment:um,morphinstance_vertex:dm,morphcolor_vertex:pm,morphnormal_vertex:fm,morphtarget_pars_vertex:mm,morphtarget_vertex:vm,normal_fragment_begin:gm,normal_fragment_maps:_m,normal_pars_fragment:xm,normal_pars_vertex:bm,normal_vertex:ym,normalmap_pars_fragment:wm,clearcoat_normal_fragment_begin:Sm,clearcoat_normal_fragment_maps:Mm,clearcoat_pars_fragment:Em,iridescence_pars_fragment:Tm,opaque_fragment:Cm,packing:Am,premultiplied_alpha_fragment:Pm,project_vertex:Rm,dithering_fragment:Dm,dithering_pars_fragment:Lm,roughnessmap_fragment:Im,roughnessmap_pars_fragment:Um,shadowmap_pars_fragment:Nm,shadowmap_pars_vertex:Fm,shadowmap_vertex:Om,shadowmask_pars_fragment:km,skinbase_vertex:Bm,skinning_pars_vertex:zm,skinning_vertex:Vm,skinnormal_vertex:Hm,specularmap_fragment:Gm,specularmap_pars_fragment:Wm,tonemapping_fragment:Xm,tonemapping_pars_fragment:jm,transmission_fragment:Km,transmission_pars_fragment:qm,uv_pars_fragment:Ym,uv_pars_vertex:$m,uv_vertex:Zm,worldpos_vertex:Jm,background_vert:Qm,background_frag:ev,backgroundCube_vert:tv,backgroundCube_frag:nv,cube_vert:iv,cube_frag:rv,depth_vert:sv,depth_frag:av,distanceRGBA_vert:ov,distanceRGBA_frag:lv,equirect_vert:cv,equirect_frag:hv,linedashed_vert:uv,linedashed_frag:dv,meshbasic_vert:pv,meshbasic_frag:fv,meshlambert_vert:mv,meshlambert_frag:vv,meshmatcap_vert:gv,meshmatcap_frag:_v,meshnormal_vert:xv,meshnormal_frag:bv,meshphong_vert:yv,meshphong_frag:wv,meshphysical_vert:Sv,meshphysical_frag:Mv,meshtoon_vert:Ev,meshtoon_frag:Tv,points_vert:Cv,points_frag:Av,shadow_vert:Pv,shadow_frag:Rv,sprite_vert:Dv,sprite_frag:Lv},re={common:{diffuse:{value:new we(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new ye(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new we(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new we(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new we(16777215)},opacity:{value:1},center:{value:new ye(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},vn={basic:{uniforms:Rt([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.fog]),vertexShader:Ie.meshbasic_vert,fragmentShader:Ie.meshbasic_frag},lambert:{uniforms:Rt([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.fog,re.lights,{emissive:{value:new we(0)}}]),vertexShader:Ie.meshlambert_vert,fragmentShader:Ie.meshlambert_frag},phong:{uniforms:Rt([re.common,re.specularmap,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.fog,re.lights,{emissive:{value:new we(0)},specular:{value:new we(1118481)},shininess:{value:30}}]),vertexShader:Ie.meshphong_vert,fragmentShader:Ie.meshphong_frag},standard:{uniforms:Rt([re.common,re.envmap,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.roughnessmap,re.metalnessmap,re.fog,re.lights,{emissive:{value:new we(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag},toon:{uniforms:Rt([re.common,re.aomap,re.lightmap,re.emissivemap,re.bumpmap,re.normalmap,re.displacementmap,re.gradientmap,re.fog,re.lights,{emissive:{value:new we(0)}}]),vertexShader:Ie.meshtoon_vert,fragmentShader:Ie.meshtoon_frag},matcap:{uniforms:Rt([re.common,re.bumpmap,re.normalmap,re.displacementmap,re.fog,{matcap:{value:null}}]),vertexShader:Ie.meshmatcap_vert,fragmentShader:Ie.meshmatcap_frag},points:{uniforms:Rt([re.points,re.fog]),vertexShader:Ie.points_vert,fragmentShader:Ie.points_frag},dashed:{uniforms:Rt([re.common,re.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ie.linedashed_vert,fragmentShader:Ie.linedashed_frag},depth:{uniforms:Rt([re.common,re.displacementmap]),vertexShader:Ie.depth_vert,fragmentShader:Ie.depth_frag},normal:{uniforms:Rt([re.common,re.bumpmap,re.normalmap,re.displacementmap,{opacity:{value:1}}]),vertexShader:Ie.meshnormal_vert,fragmentShader:Ie.meshnormal_frag},sprite:{uniforms:Rt([re.sprite,re.fog]),vertexShader:Ie.sprite_vert,fragmentShader:Ie.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ie.background_vert,fragmentShader:Ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:Ie.backgroundCube_vert,fragmentShader:Ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ie.cube_vert,fragmentShader:Ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ie.equirect_vert,fragmentShader:Ie.equirect_frag},distanceRGBA:{uniforms:Rt([re.common,re.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ie.distanceRGBA_vert,fragmentShader:Ie.distanceRGBA_frag},shadow:{uniforms:Rt([re.lights,re.fog,{color:{value:new we(0)},opacity:{value:1}}]),vertexShader:Ie.shadow_vert,fragmentShader:Ie.shadow_frag}};vn.physical={uniforms:Rt([vn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new ye(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new we(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new ye},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new we(0)},specularColor:{value:new we(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new ye},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag};const As={r:0,b:0,g:0},ui=new kn,Iv=new $e;function Uv(n,e,t,i,r,s,a){const o=new we(0);let l=s===!0?0:1,c,h,u=null,d=0,m=null;function g(M){let y=M.isScene===!0?M.background:null;return y&&y.isTexture&&(y=(M.backgroundBlurriness>0?t:e).get(y)),y}function x(M){let y=!1;const S=g(M);S===null?f(o,l):S&&S.isColor&&(f(S,1),y=!0);const N=n.xr.getEnvironmentBlendMode();N==="additive"?i.buffers.color.setClear(0,0,0,1,a):N==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,a),(n.autoClear||y)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function p(M,y){const S=g(y);S&&(S.isCubeTexture||S.mapping===ta)?(h===void 0&&(h=new ut(new $r(1,1,1),new mt({name:"BackgroundCubeMaterial",uniforms:mr(vn.backgroundCube.uniforms),vertexShader:vn.backgroundCube.vertexShader,fragmentShader:vn.backgroundCube.fragmentShader,side:zt,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(N,A,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(h)),ui.copy(y.backgroundRotation),ui.x*=-1,ui.y*=-1,ui.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(ui.y*=-1,ui.z*=-1),h.material.uniforms.envMap.value=S,h.material.uniforms.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Iv.makeRotationFromEuler(ui)),h.material.toneMapped=qe.getTransfer(S.colorSpace)!==rt,(u!==S||d!==S.version||m!==n.toneMapping)&&(h.material.needsUpdate=!0,u=S,d=S.version,m=n.toneMapping),h.layers.enableAll(),M.unshift(h,h.geometry,h.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new ut(new _n(2,2),new mt({name:"BackgroundMaterial",uniforms:mr(vn.background.uniforms),vertexShader:vn.background.vertexShader,fragmentShader:vn.background.fragmentShader,side:ni,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=qe.getTransfer(S.colorSpace)!==rt,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||d!==S.version||m!==n.toneMapping)&&(c.material.needsUpdate=!0,u=S,d=S.version,m=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function f(M,y){M.getRGB(As,cu(n)),i.buffers.color.setClear(As.r,As.g,As.b,y,a)}return{getClearColor:function(){return o},setClearColor:function(M,y=1){o.set(M),l=y,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(M){l=M,f(o,l)},render:x,addToRenderList:p}}function Nv(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=d(null);let s=r,a=!1;function o(v,w,H,G,X){let z=!1;const C=u(G,H,w);s!==C&&(s=C,c(s.object)),z=m(v,G,H,X),z&&g(v,G,H,X),X!==null&&e.update(X,n.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,S(v,w,H,G),X!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function l(){return n.createVertexArray()}function c(v){return n.bindVertexArray(v)}function h(v){return n.deleteVertexArray(v)}function u(v,w,H){const G=H.wireframe===!0;let X=i[v.id];X===void 0&&(X={},i[v.id]=X);let z=X[w.id];z===void 0&&(z={},X[w.id]=z);let C=z[G];return C===void 0&&(C=d(l()),z[G]=C),C}function d(v){const w=[],H=[],G=[];for(let X=0;X<t;X++)w[X]=0,H[X]=0,G[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:w,enabledAttributes:H,attributeDivisors:G,object:v,attributes:{},index:null}}function m(v,w,H,G){const X=s.attributes,z=w.attributes;let C=0;const V=H.getAttributes();for(const U in V)if(V[U].location>=0){const Q=X[U];let Z=z[U];if(Z===void 0&&(U==="instanceMatrix"&&v.instanceMatrix&&(Z=v.instanceMatrix),U==="instanceColor"&&v.instanceColor&&(Z=v.instanceColor)),Q===void 0||Q.attribute!==Z||Z&&Q.data!==Z.data)return!0;C++}return s.attributesNum!==C||s.index!==G}function g(v,w,H,G){const X={},z=w.attributes;let C=0;const V=H.getAttributes();for(const U in V)if(V[U].location>=0){let Q=z[U];Q===void 0&&(U==="instanceMatrix"&&v.instanceMatrix&&(Q=v.instanceMatrix),U==="instanceColor"&&v.instanceColor&&(Q=v.instanceColor));const Z={};Z.attribute=Q,Q&&Q.data&&(Z.data=Q.data),X[U]=Z,C++}s.attributes=X,s.attributesNum=C,s.index=G}function x(){const v=s.newAttributes;for(let w=0,H=v.length;w<H;w++)v[w]=0}function p(v){f(v,0)}function f(v,w){const H=s.newAttributes,G=s.enabledAttributes,X=s.attributeDivisors;H[v]=1,G[v]===0&&(n.enableVertexAttribArray(v),G[v]=1),X[v]!==w&&(n.vertexAttribDivisor(v,w),X[v]=w)}function M(){const v=s.newAttributes,w=s.enabledAttributes;for(let H=0,G=w.length;H<G;H++)w[H]!==v[H]&&(n.disableVertexAttribArray(H),w[H]=0)}function y(v,w,H,G,X,z,C){C===!0?n.vertexAttribIPointer(v,w,H,X,z):n.vertexAttribPointer(v,w,H,G,X,z)}function S(v,w,H,G){x();const X=G.attributes,z=H.getAttributes(),C=w.defaultAttributeValues;for(const V in z){const U=z[V];if(U.location>=0){let ee=X[V];if(ee===void 0&&(V==="instanceMatrix"&&v.instanceMatrix&&(ee=v.instanceMatrix),V==="instanceColor"&&v.instanceColor&&(ee=v.instanceColor)),ee!==void 0){const Q=ee.normalized,Z=ee.itemSize,ge=e.get(ee);if(ge===void 0)continue;const Pe=ge.buffer,j=ge.type,te=ge.bytesPerElement,me=j===n.INT||j===n.UNSIGNED_INT||ee.gpuType===ol;if(ee.isInterleavedBufferAttribute){const he=ee.data,De=he.stride,Me=ee.offset;if(he.isInstancedInterleavedBuffer){for(let ke=0;ke<U.locationSize;ke++)f(U.location+ke,he.meshPerAttribute);v.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=he.meshPerAttribute*he.count)}else for(let ke=0;ke<U.locationSize;ke++)p(U.location+ke);n.bindBuffer(n.ARRAY_BUFFER,Pe);for(let ke=0;ke<U.locationSize;ke++)y(U.location+ke,Z/U.locationSize,j,Q,De*te,(Me+Z/U.locationSize*ke)*te,me)}else{if(ee.isInstancedBufferAttribute){for(let he=0;he<U.locationSize;he++)f(U.location+he,ee.meshPerAttribute);v.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let he=0;he<U.locationSize;he++)p(U.location+he);n.bindBuffer(n.ARRAY_BUFFER,Pe);for(let he=0;he<U.locationSize;he++)y(U.location+he,Z/U.locationSize,j,Q,Z*te,Z/U.locationSize*he*te,me)}}else if(C!==void 0){const Q=C[V];if(Q!==void 0)switch(Q.length){case 2:n.vertexAttrib2fv(U.location,Q);break;case 3:n.vertexAttrib3fv(U.location,Q);break;case 4:n.vertexAttrib4fv(U.location,Q);break;default:n.vertexAttrib1fv(U.location,Q)}}}}M()}function N(){F();for(const v in i){const w=i[v];for(const H in w){const G=w[H];for(const X in G)h(G[X].object),delete G[X];delete w[H]}delete i[v]}}function A(v){if(i[v.id]===void 0)return;const w=i[v.id];for(const H in w){const G=w[H];for(const X in G)h(G[X].object),delete G[X];delete w[H]}delete i[v.id]}function T(v){for(const w in i){const H=i[w];if(H[v.id]===void 0)continue;const G=H[v.id];for(const X in G)h(G[X].object),delete G[X];delete H[v.id]}}function F(){K(),a=!0,s!==r&&(s=r,c(s.object))}function K(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:F,resetDefaultState:K,dispose:N,releaseStatesOfGeometry:A,releaseStatesOfProgram:T,initAttributes:x,enableAttribute:p,disableUnusedAttributes:M}}function Fv(n,e,t){let i;function r(c){i=c}function s(c,h){n.drawArrays(i,c,h),t.update(h,i,1)}function a(c,h,u){u!==0&&(n.drawArraysInstanced(i,c,h,u),t.update(h,i,u))}function o(c,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,h,0,u);let m=0;for(let g=0;g<u;g++)m+=h[g];t.update(m,i,1)}function l(c,h,u,d){if(u===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<c.length;g++)a(c[g],h[g],d[g]);else{m.multiDrawArraysInstancedWEBGL(i,c,0,h,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=h[x];for(let x=0;x<d.length;x++)t.update(g,i,d[x])}}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Ov(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const T=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(T){return!(T!==Yt&&i.convert(T)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){const F=T===$t&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(T!==xn&&i.convert(T)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==mn&&!F)}function l(T){if(T==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control");if(d===!0){const T=e.get("EXT_clip_control");T.clipControlEXT(T.LOWER_LEFT_EXT,T.ZERO_TO_ONE_EXT)}const m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_TEXTURE_SIZE),p=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),f=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),y=n.getParameter(n.MAX_VARYING_VECTORS),S=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),N=g>0,A=n.getParameter(n.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:M,maxVaryings:y,maxFragmentUniforms:S,vertexTextures:N,maxSamples:A}}function kv(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new Jn,o=new Ue,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const m=u.length!==0||d||i!==0||r;return r=d,i=u.length,m},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,m){const g=u.clippingPlanes,x=u.clipIntersection,p=u.clipShadows,f=n.get(u);if(!r||g===null||g.length===0||s&&!p)s?h(null):c();else{const M=s?0:i,y=M*4;let S=f.clippingState||null;l.value=S,S=h(g,d,y,m);for(let N=0;N!==y;++N)S[N]=t[N];f.clippingState=S,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(u,d,m,g){const x=u!==null?u.length:0;let p=null;if(x!==0){if(p=l.value,g!==!0||p===null){const f=m+x*4,M=d.matrixWorldInverse;o.getNormalMatrix(M),(p===null||p.length<f)&&(p=new Float32Array(f));for(let y=0,S=m;y!==x;++y,S+=4)a.copy(u[y]).applyMatrix4(M,o),a.normal.toArray(p,S),p[S+3]=a.constant}l.value=p,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,p}}function Bv(n){let e=new WeakMap;function t(a,o){return o===bo?a.mapping=hr:o===yo&&(a.mapping=ur),a}function i(a){if(a&&a.isTexture){const o=a.mapping;if(o===bo||o===yo)if(e.has(a)){const l=e.get(a).texture;return t(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Yp(l.height);return c.fromEquirectangularTexture(n,a),e.set(a,c),a.addEventListener("dispose",r),t(c.texture,a.mapping)}else return null}}return a}function r(a){const o=a.target;o.removeEventListener("dispose",r);const l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:i,dispose:s}}class sa extends uu{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const tr=4,Ec=[.125,.215,.35,.446,.526,.582],xi=20,Ga=new sa,Tc=new we;let Wa=null,Xa=0,ja=0,Ka=!1;const gi=(1+Math.sqrt(5))/2,Ki=1/gi,Cc=[new L(-gi,Ki,0),new L(gi,Ki,0),new L(-Ki,0,gi),new L(Ki,0,gi),new L(0,gi,-Ki),new L(0,gi,Ki),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)];class Ac{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,r=100){Wa=this._renderer.getRenderTarget(),Xa=this._renderer.getActiveCubeFace(),ja=this._renderer.getActiveMipmapLevel(),Ka=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,i,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Rc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Wa,Xa,ja),this._renderer.xr.enabled=Ka,e.scissorTest=!1,Ps(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===hr||e.mapping===ur?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Wa=this._renderer.getRenderTarget(),Xa=this._renderer.getActiveCubeFace(),ja=this._renderer.getActiveMipmapLevel(),Ka=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Tt,minFilter:Tt,generateMipmaps:!1,type:$t,format:Yt,colorSpace:si,depthBuffer:!1},r=Pc(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Pc(e,t,i);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=zv(s)),this._blurMaterial=Vv(s,e,t)}return r}_compileMaterial(e){const t=new ut(this._lodPlanes[0],e);this._renderer.compile(t,Ga)}_sceneToCubeUV(e,t,i,r){const o=new rn(90,1,t,i),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Tc),h.toneMapping=ei,h.autoClear=!1;const m=new au({name:"PMREM.Background",side:zt,depthWrite:!1,depthTest:!1}),g=new ut(new $r,m);let x=!1;const p=e.background;p?p.isColor&&(m.color.copy(p),e.background=null,x=!0):(m.color.copy(Tc),x=!0);for(let f=0;f<6;f++){const M=f%3;M===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):M===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));const y=this._cubeSize;Ps(r,M*y,f>2?y:0,y,y),h.setRenderTarget(r),x&&h.render(g,o),h.render(e,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=p}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===hr||e.mapping===ur;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Rc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=new ut(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Ps(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Ga)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Cc[(r-s-1)%Cc.length];this._blur(e,s-1,s,a,o)}t.autoClear=i}_blur(e,t,i,r,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,i,r,"latitudinal",s),this._halfBlur(a,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new ut(this._lodPlanes[r],c),d=c.uniforms,m=this._sizeLods[i]-1,g=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*xi-1),x=s/g,p=isFinite(s)?1+Math.floor(h*x):xi;p>xi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${xi}`);const f=[];let M=0;for(let T=0;T<xi;++T){const F=T/x,K=Math.exp(-F*F/2);f.push(K),T===0?M+=K:T<p&&(M+=2*K)}for(let T=0;T<f.length;T++)f[T]=f[T]/M;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=f,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:y}=this;d.dTheta.value=g,d.mipInt.value=y-i;const S=this._sizeLods[r],N=3*S*(r>y-tr?r-y+tr:0),A=4*(this._cubeSize-S);Ps(t,N,A,3*S,2*S),l.setRenderTarget(t),l.render(u,Ga)}}function zv(n){const e=[],t=[],i=[];let r=n;const s=n-tr+1+Ec.length;for(let a=0;a<s;a++){const o=Math.pow(2,r);t.push(o);let l=1/o;a>n-tr?l=Ec[a-n+tr-1]:a===0&&(l=0),i.push(l);const c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],m=6,g=6,x=3,p=2,f=1,M=new Float32Array(x*g*m),y=new Float32Array(p*g*m),S=new Float32Array(f*g*m);for(let A=0;A<m;A++){const T=A%3*2/3-1,F=A>2?0:-1,K=[T,F,0,T+2/3,F,0,T+2/3,F+1,0,T,F,0,T+2/3,F+1,0,T,F+1,0];M.set(K,x*g*A),y.set(d,p*g*A);const v=[A,A,A,A,A,A];S.set(v,f*g*A)}const N=new Zt;N.setAttribute("position",new St(M,x)),N.setAttribute("uv",new St(y,p)),N.setAttribute("faceIndex",new St(S,f)),e.push(N),r>tr&&r--}return{lodPlanes:e,sizeLods:t,sigmas:i}}function Pc(n,e,t){const i=new bn(n,e,t);return i.texture.mapping=ta,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ps(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function Vv(n,e,t){const i=new Float32Array(xi),r=new L(0,1,0);return new mt({name:"SphericalGaussianBlur",defines:{n:xi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:vl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Rc(){return new mt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:vl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function Dc(){return new mt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:vl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Fn,depthTest:!1,depthWrite:!1})}function vl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Hv(n){let e=new WeakMap,t=null;function i(o){if(o&&o.isTexture){const l=o.mapping,c=l===bo||l===yo,h=l===hr||l===ur;if(c||h){let u=e.get(o);const d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new Ac(n)),u=c?t.fromEquirectangular(o,u):t.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),u.texture;if(u!==void 0)return u.texture;{const m=o.image;return c&&m&&m.height>0||h&&m&&r(m)?(t===null&&(t=new Ac(n)),u=c?t.fromEquirectangular(o):t.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,e.set(o,u),o.addEventListener("dispose",s),u.texture):null}}}return o}function r(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:a}}function Gv(n){const e={};function t(i){if(e[i]!==void 0)return e[i];let r;switch(i){case"WEBGL_depth_texture":r=n.getExtension("WEBGL_depth_texture")||n.getExtension("MOZ_WEBGL_depth_texture")||n.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=n.getExtension("EXT_texture_filter_anisotropic")||n.getExtension("MOZ_EXT_texture_filter_anisotropic")||n.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=n.getExtension("WEBGL_compressed_texture_s3tc")||n.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=n.getExtension("WEBGL_compressed_texture_pvrtc")||n.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=n.getExtension(i)}return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&Vs("THREE.WebGLRenderer: "+i+" extension not supported."),r}}}function Wv(n,e,t,i){const r={},s=new WeakMap;function a(u){const d=u.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);for(const g in d.morphAttributes){const x=d.morphAttributes[g];for(let p=0,f=x.length;p<f;p++)e.remove(x[p])}d.removeEventListener("dispose",a),delete r[d.id];const m=s.get(d);m&&(e.remove(m),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(u,d){return r[d.id]===!0||(d.addEventListener("dispose",a),r[d.id]=!0,t.memory.geometries++),d}function l(u){const d=u.attributes;for(const g in d)e.update(d[g],n.ARRAY_BUFFER);const m=u.morphAttributes;for(const g in m){const x=m[g];for(let p=0,f=x.length;p<f;p++)e.update(x[p],n.ARRAY_BUFFER)}}function c(u){const d=[],m=u.index,g=u.attributes.position;let x=0;if(m!==null){const M=m.array;x=m.version;for(let y=0,S=M.length;y<S;y+=3){const N=M[y+0],A=M[y+1],T=M[y+2];d.push(N,A,A,T,T,N)}}else if(g!==void 0){const M=g.array;x=g.version;for(let y=0,S=M.length/3-1;y<S;y+=3){const N=y+0,A=y+1,T=y+2;d.push(N,A,A,T,T,N)}}else return;const p=new(nu(d)?lu:ou)(d,1);p.version=x;const f=s.get(u);f&&e.remove(f),s.set(u,p)}function h(u){const d=s.get(u);if(d){const m=u.index;m!==null&&d.version<m.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Xv(n,e,t){let i;function r(d){i=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function l(d,m){n.drawElements(i,m,s,d*a),t.update(m,i,1)}function c(d,m,g){g!==0&&(n.drawElementsInstanced(i,m,s,d*a,g),t.update(m,i,g))}function h(d,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,m,0,s,d,0,g);let p=0;for(let f=0;f<g;f++)p+=m[f];t.update(p,i,1)}function u(d,m,g,x){if(g===0)return;const p=e.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<d.length;f++)c(d[f]/a,m[f],x[f]);else{p.multiDrawElementsInstancedWEBGL(i,m,0,s,d,0,x,0,g);let f=0;for(let M=0;M<g;M++)f+=m[M];for(let M=0;M<x.length;M++)t.update(f,i,x[M])}}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function jv(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function Kv(n,e,t){const i=new WeakMap,r=new at;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let d=i.get(o);if(d===void 0||d.count!==u){let K=function(){T.dispose(),i.delete(o),o.removeEventListener("dispose",K)};d!==void 0&&d.texture.dispose();const m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let y=0;m===!0&&(y=1),g===!0&&(y=2),x===!0&&(y=3);let S=o.attributes.position.count*y,N=1;S>e.maxTextureSize&&(N=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);const A=new Float32Array(S*N*4*u),T=new ru(A,S,N,u);T.type=mn,T.needsUpdate=!0;const F=y*4;for(let v=0;v<u;v++){const w=p[v],H=f[v],G=M[v],X=S*N*4*v;for(let z=0;z<w.count;z++){const C=z*F;m===!0&&(r.fromBufferAttribute(w,z),A[X+C+0]=r.x,A[X+C+1]=r.y,A[X+C+2]=r.z,A[X+C+3]=0),g===!0&&(r.fromBufferAttribute(H,z),A[X+C+4]=r.x,A[X+C+5]=r.y,A[X+C+6]=r.z,A[X+C+7]=0),x===!0&&(r.fromBufferAttribute(G,z),A[X+C+8]=r.x,A[X+C+9]=r.y,A[X+C+10]=r.z,A[X+C+11]=G.itemSize===4?r.w:1)}}d={count:u,texture:T,size:new ye(S,N)},i.set(o,d),o.addEventListener("dispose",K)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let m=0;for(let x=0;x<c.length;x++)m+=c[x];const g=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:s}}function qv(n,e,t,i){let r=new WeakMap;function s(l){const c=i.render.frame,h=l.geometry,u=e.get(l,h);if(r.get(u)!==c&&(e.update(u),r.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return u}function a(){r=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}class fu extends Lt{constructor(e,t,i,r,s,a,o,l,c,h=rr){if(h!==rr&&h!==fr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===rr&&(i=ii),i===void 0&&h===fr&&(i=pr),super(null,r,s,a,o,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:ct,this.minFilter=l!==void 0?l:ct,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const mu=new Lt,Lc=new fu(1,1),vu=new ru,gu=new Up,_u=new du,Ic=[],Uc=[],Nc=new Float32Array(16),Fc=new Float32Array(9),Oc=new Float32Array(4);function _r(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=Ic[r];if(s===void 0&&(s=new Float32Array(r),Ic[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function bt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function yt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function aa(n,e){let t=Uc[e];t===void 0&&(t=new Int32Array(e),Uc[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Yv(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function $v(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;n.uniform2fv(this.addr,e),yt(t,e)}}function Zv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(bt(t,e))return;n.uniform3fv(this.addr,e),yt(t,e)}}function Jv(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;n.uniform4fv(this.addr,e),yt(t,e)}}function Qv(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(bt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),yt(t,e)}else{if(bt(t,i))return;Oc.set(i),n.uniformMatrix2fv(this.addr,!1,Oc),yt(t,i)}}function eg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(bt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),yt(t,e)}else{if(bt(t,i))return;Fc.set(i),n.uniformMatrix3fv(this.addr,!1,Fc),yt(t,i)}}function tg(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(bt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),yt(t,e)}else{if(bt(t,i))return;Nc.set(i),n.uniformMatrix4fv(this.addr,!1,Nc),yt(t,i)}}function ng(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function ig(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;n.uniform2iv(this.addr,e),yt(t,e)}}function rg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;n.uniform3iv(this.addr,e),yt(t,e)}}function sg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;n.uniform4iv(this.addr,e),yt(t,e)}}function ag(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function og(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(bt(t,e))return;n.uniform2uiv(this.addr,e),yt(t,e)}}function lg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(bt(t,e))return;n.uniform3uiv(this.addr,e),yt(t,e)}}function cg(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(bt(t,e))return;n.uniform4uiv(this.addr,e),yt(t,e)}}function hg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Lc.compareFunction=tu,s=Lc):s=mu,t.setTexture2D(e||s,r)}function ug(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||gu,r)}function dg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||_u,r)}function pg(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||vu,r)}function fg(n){switch(n){case 5126:return Yv;case 35664:return $v;case 35665:return Zv;case 35666:return Jv;case 35674:return Qv;case 35675:return eg;case 35676:return tg;case 5124:case 35670:return ng;case 35667:case 35671:return ig;case 35668:case 35672:return rg;case 35669:case 35673:return sg;case 5125:return ag;case 36294:return og;case 36295:return lg;case 36296:return cg;case 35678:case 36198:case 36298:case 36306:case 35682:return hg;case 35679:case 36299:case 36307:return ug;case 35680:case 36300:case 36308:case 36293:return dg;case 36289:case 36303:case 36311:case 36292:return pg}}function mg(n,e){n.uniform1fv(this.addr,e)}function vg(n,e){const t=_r(e,this.size,2);n.uniform2fv(this.addr,t)}function gg(n,e){const t=_r(e,this.size,3);n.uniform3fv(this.addr,t)}function _g(n,e){const t=_r(e,this.size,4);n.uniform4fv(this.addr,t)}function xg(n,e){const t=_r(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function bg(n,e){const t=_r(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function yg(n,e){const t=_r(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function wg(n,e){n.uniform1iv(this.addr,e)}function Sg(n,e){n.uniform2iv(this.addr,e)}function Mg(n,e){n.uniform3iv(this.addr,e)}function Eg(n,e){n.uniform4iv(this.addr,e)}function Tg(n,e){n.uniform1uiv(this.addr,e)}function Cg(n,e){n.uniform2uiv(this.addr,e)}function Ag(n,e){n.uniform3uiv(this.addr,e)}function Pg(n,e){n.uniform4uiv(this.addr,e)}function Rg(n,e,t){const i=this.cache,r=e.length,s=aa(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),yt(i,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||mu,s[a])}function Dg(n,e,t){const i=this.cache,r=e.length,s=aa(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),yt(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||gu,s[a])}function Lg(n,e,t){const i=this.cache,r=e.length,s=aa(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),yt(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||_u,s[a])}function Ig(n,e,t){const i=this.cache,r=e.length,s=aa(t,r);bt(i,s)||(n.uniform1iv(this.addr,s),yt(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||vu,s[a])}function Ug(n){switch(n){case 5126:return mg;case 35664:return vg;case 35665:return gg;case 35666:return _g;case 35674:return xg;case 35675:return bg;case 35676:return yg;case 5124:case 35670:return wg;case 35667:case 35671:return Sg;case 35668:case 35672:return Mg;case 35669:case 35673:return Eg;case 5125:return Tg;case 36294:return Cg;case 36295:return Ag;case 36296:return Pg;case 35678:case 36198:case 36298:case 36306:case 35682:return Rg;case 35679:case 36299:case 36307:return Dg;case 35680:case 36300:case 36308:case 36293:return Lg;case 36289:case 36303:case 36311:case 36292:return Ig}}class Ng{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=fg(t.type)}}class Fg{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ug(t.type)}}class Og{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const qa=/(\w+)(\])?(\[|\.)?/g;function kc(n,e){n.seq.push(e),n.map[e.id]=e}function kg(n,e,t){const i=n.name,r=i.length;for(qa.lastIndex=0;;){const s=qa.exec(i),a=qa.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){kc(t,c===void 0?new Ng(o,n,e):new Fg(o,n,e));break}else{let u=t.map[o];u===void 0&&(u=new Og(o),kc(t,u)),t=u}}}class Hs{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){const s=e.getActiveUniform(t,r),a=e.getUniformLocation(t,s.name);kg(s,a,this)}}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function Bc(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const Bg=37297;let zg=0;function Vg(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}function Hg(n){const e=qe.getPrimaries(qe.workingColorSpace),t=qe.getPrimaries(n);let i;switch(e===t?i="":e===Ks&&t===js?i="LinearDisplayP3ToLinearSRGB":e===js&&t===Ks&&(i="LinearSRGBToLinearDisplayP3"),n){case si:case ia:return[i,"LinearTransferOETF"];case dn:case dl:return[i,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[i,"LinearTransferOETF"]}}function zc(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),r=n.getShaderInfoLog(e).trim();if(i&&r==="")return"";const s=/ERROR: 0:(\d+)/.exec(r);if(s){const a=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+Vg(n.getShaderSource(e),a)}else return r}function Gg(n,e){const t=Hg(e);return`vec4 ${n}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function Wg(n,e){let t;switch(e){case sp:t="Linear";break;case ap:t="Reinhard";break;case op:t="Cineon";break;case Xh:t="ACESFilmic";break;case cp:t="AgX";break;case hp:t="Neutral";break;case lp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Rs=new L;function Xg(){qe.getLuminanceCoefficients(Rs);const n=Rs.x.toFixed(4),e=Rs.y.toFixed(4),t=Rs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function jg(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(kr).join(`
`)}function Kg(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function qg(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function kr(n){return n!==""}function Vc(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Hc(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Yg=/^[ \t]*#include +<([\w\d./]+)>/gm;function $o(n){return n.replace(Yg,Zg)}const $g=new Map;function Zg(n,e){let t=Ie[e];if(t===void 0){const i=$g.get(e);if(i!==void 0)t=Ie[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return $o(t)}const Jg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Gc(n){return n.replace(Jg,Qg)}function Qg(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Wc(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function e_(n){let e="SHADOWMAP_TYPE_BASIC";return n.shadowMapType===Hh?e="SHADOWMAP_TYPE_PCF":n.shadowMapType===zd?e="SHADOWMAP_TYPE_PCF_SOFT":n.shadowMapType===Rn&&(e="SHADOWMAP_TYPE_VSM"),e}function t_(n){let e="ENVMAP_TYPE_CUBE";if(n.envMap)switch(n.envMapMode){case hr:case ur:e="ENVMAP_TYPE_CUBE";break;case ta:e="ENVMAP_TYPE_CUBE_UV";break}return e}function n_(n){let e="ENVMAP_MODE_REFLECTION";if(n.envMap)switch(n.envMapMode){case ur:e="ENVMAP_MODE_REFRACTION";break}return e}function i_(n){let e="ENVMAP_BLENDING_NONE";if(n.envMap)switch(n.combine){case Wh:e="ENVMAP_BLENDING_MULTIPLY";break;case ip:e="ENVMAP_BLENDING_MIX";break;case rp:e="ENVMAP_BLENDING_ADD";break}return e}function r_(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:i,maxMip:t}}function s_(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=e_(t),c=t_(t),h=n_(t),u=i_(t),d=r_(t),m=jg(t),g=Kg(s),x=r.createProgram();let p,f,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(kr).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(kr).join(`
`),f.length>0&&(f+=`
`)):(p=[Wc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(kr).join(`
`),f=[Wc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ei?"#define TONE_MAPPING":"",t.toneMapping!==ei?Ie.tonemapping_pars_fragment:"",t.toneMapping!==ei?Wg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ie.colorspace_pars_fragment,Gg("linearToOutputTexel",t.outputColorSpace),Xg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(kr).join(`
`)),a=$o(a),a=Vc(a,t),a=Hc(a,t),o=$o(o),o=Vc(o,t),o=Hc(o,t),a=Gc(a),o=Gc(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",t.glslVersion===Vt?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Vt?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const y=M+p+a,S=M+f+o,N=Bc(r,r.VERTEX_SHADER,y),A=Bc(r,r.FRAGMENT_SHADER,S);r.attachShader(x,N),r.attachShader(x,A),t.index0AttributeName!==void 0?r.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x);function T(w){if(n.debug.checkShaderErrors){const H=r.getProgramInfoLog(x).trim(),G=r.getShaderInfoLog(N).trim(),X=r.getShaderInfoLog(A).trim();let z=!0,C=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(z=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,x,N,A);else{const V=zc(r,N,"vertex"),U=zc(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+w.name+`
Material Type: `+w.type+`

Program Info Log: `+H+`
`+V+`
`+U)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(G===""||X==="")&&(C=!1);C&&(w.diagnostics={runnable:z,programLog:H,vertexShader:{log:G,prefix:p},fragmentShader:{log:X,prefix:f}})}r.deleteShader(N),r.deleteShader(A),F=new Hs(r,x),K=qg(r,x)}let F;this.getUniforms=function(){return F===void 0&&T(this),F};let K;this.getAttributes=function(){return K===void 0&&T(this),K};let v=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=r.getProgramParameter(x,Bg)),v},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=zg++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=N,this.fragmentShader=A,this}let a_=0;class o_{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new l_(e),t.set(e,i)),i}}class l_{constructor(e){this.id=a_++,this.code=e,this.usedTimes=0}}function c_(n,e,t,i,r,s,a){const o=new fl,l=new o_,c=new Set,h=[],u=r.logarithmicDepthBuffer,d=r.reverseDepthBuffer,m=r.vertexTextures;let g=r.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(v){return c.add(v),v===0?"uv":`uv${v}`}function f(v,w,H,G,X){const z=G.fog,C=X.geometry,V=v.isMeshStandardMaterial?G.environment:null,U=(v.isMeshStandardMaterial?t:e).get(v.envMap||V),ee=U&&U.mapping===ta?U.image.height:null,Q=x[v.type];v.precision!==null&&(g=r.getMaxPrecision(v.precision),g!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",g,"instead."));const Z=C.morphAttributes.position||C.morphAttributes.normal||C.morphAttributes.color,ge=Z!==void 0?Z.length:0;let Pe=0;C.morphAttributes.position!==void 0&&(Pe=1),C.morphAttributes.normal!==void 0&&(Pe=2),C.morphAttributes.color!==void 0&&(Pe=3);let j,te,me,he;if(Q){const Ft=vn[Q];j=Ft.vertexShader,te=Ft.fragmentShader}else j=v.vertexShader,te=v.fragmentShader,l.update(v),me=l.getVertexShaderID(v),he=l.getFragmentShaderID(v);const De=n.getRenderTarget(),Me=X.isInstancedMesh===!0,ke=X.isBatchedMesh===!0,Je=!!v.map,Be=!!v.matcap,P=!!U,Gt=!!v.aoMap,Fe=!!v.lightMap,He=!!v.bumpMap,Te=!!v.normalMap,nt=!!v.displacementMap,Re=!!v.emissiveMap,E=!!v.metalnessMap,_=!!v.roughnessMap,O=v.anisotropy>0,Y=v.clearcoat>0,J=v.dispersion>0,q=v.iridescence>0,_e=v.sheen>0,se=v.transmission>0,ue=O&&!!v.anisotropyMap,Ge=Y&&!!v.clearcoatMap,ne=Y&&!!v.clearcoatNormalMap,de=Y&&!!v.clearcoatRoughnessMap,Ce=q&&!!v.iridescenceMap,Ae=q&&!!v.iridescenceThicknessMap,pe=_e&&!!v.sheenColorMap,Oe=_e&&!!v.sheenRoughnessMap,Le=!!v.specularMap,et=!!v.specularColorMap,R=!!v.specularIntensityMap,le=se&&!!v.transmissionMap,W=se&&!!v.thicknessMap,$=!!v.gradientMap,ae=!!v.alphaMap,ce=v.alphaTest>0,ze=!!v.alphaHash,pt=!!v.extensions;let Nt=ei;v.toneMapped&&(De===null||De.isXRRenderTarget===!0)&&(Nt=n.toneMapping);const Xe={shaderID:Q,shaderType:v.type,shaderName:v.name,vertexShader:j,fragmentShader:te,defines:v.defines,customVertexShaderID:me,customFragmentShaderID:he,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:g,batching:ke,batchingColor:ke&&X._colorsTexture!==null,instancing:Me,instancingColor:Me&&X.instanceColor!==null,instancingMorph:Me&&X.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:De===null?n.outputColorSpace:De.isXRRenderTarget===!0?De.texture.colorSpace:si,alphaToCoverage:!!v.alphaToCoverage,map:Je,matcap:Be,envMap:P,envMapMode:P&&U.mapping,envMapCubeUVHeight:ee,aoMap:Gt,lightMap:Fe,bumpMap:He,normalMap:Te,displacementMap:m&&nt,emissiveMap:Re,normalMapObjectSpace:Te&&v.normalMapType===mp,normalMapTangentSpace:Te&&v.normalMapType===fp,metalnessMap:E,roughnessMap:_,anisotropy:O,anisotropyMap:ue,clearcoat:Y,clearcoatMap:Ge,clearcoatNormalMap:ne,clearcoatRoughnessMap:de,dispersion:J,iridescence:q,iridescenceMap:Ce,iridescenceThicknessMap:Ae,sheen:_e,sheenColorMap:pe,sheenRoughnessMap:Oe,specularMap:Le,specularColorMap:et,specularIntensityMap:R,transmission:se,transmissionMap:le,thicknessMap:W,gradientMap:$,opaque:v.transparent===!1&&v.blending===yi&&v.alphaToCoverage===!1,alphaMap:ae,alphaTest:ce,alphaHash:ze,combine:v.combine,mapUv:Je&&p(v.map.channel),aoMapUv:Gt&&p(v.aoMap.channel),lightMapUv:Fe&&p(v.lightMap.channel),bumpMapUv:He&&p(v.bumpMap.channel),normalMapUv:Te&&p(v.normalMap.channel),displacementMapUv:nt&&p(v.displacementMap.channel),emissiveMapUv:Re&&p(v.emissiveMap.channel),metalnessMapUv:E&&p(v.metalnessMap.channel),roughnessMapUv:_&&p(v.roughnessMap.channel),anisotropyMapUv:ue&&p(v.anisotropyMap.channel),clearcoatMapUv:Ge&&p(v.clearcoatMap.channel),clearcoatNormalMapUv:ne&&p(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:de&&p(v.clearcoatRoughnessMap.channel),iridescenceMapUv:Ce&&p(v.iridescenceMap.channel),iridescenceThicknessMapUv:Ae&&p(v.iridescenceThicknessMap.channel),sheenColorMapUv:pe&&p(v.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&p(v.sheenRoughnessMap.channel),specularMapUv:Le&&p(v.specularMap.channel),specularColorMapUv:et&&p(v.specularColorMap.channel),specularIntensityMapUv:R&&p(v.specularIntensityMap.channel),transmissionMapUv:le&&p(v.transmissionMap.channel),thicknessMapUv:W&&p(v.thicknessMap.channel),alphaMapUv:ae&&p(v.alphaMap.channel),vertexTangents:!!C.attributes.tangent&&(Te||O),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!C.attributes.color&&C.attributes.color.itemSize===4,pointsUvs:X.isPoints===!0&&!!C.attributes.uv&&(Je||ae),fog:!!z,useFog:v.fog===!0,fogExp2:!!z&&z.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:d,skinning:X.isSkinnedMesh===!0,morphTargets:C.morphAttributes.position!==void 0,morphNormals:C.morphAttributes.normal!==void 0,morphColors:C.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:Pe,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:v.dithering,shadowMapEnabled:n.shadowMap.enabled&&H.length>0,shadowMapType:n.shadowMap.type,toneMapping:Nt,decodeVideoTexture:Je&&v.map.isVideoTexture===!0&&qe.getTransfer(v.map.colorSpace)===rt,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===pn,flipSided:v.side===zt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:pt&&v.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(pt&&v.extensions.multiDraw===!0||ke)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Xe.vertexUv1s=c.has(1),Xe.vertexUv2s=c.has(2),Xe.vertexUv3s=c.has(3),c.clear(),Xe}function M(v){const w=[];if(v.shaderID?w.push(v.shaderID):(w.push(v.customVertexShaderID),w.push(v.customFragmentShaderID)),v.defines!==void 0)for(const H in v.defines)w.push(H),w.push(v.defines[H]);return v.isRawShaderMaterial===!1&&(y(w,v),S(w,v),w.push(n.outputColorSpace)),w.push(v.customProgramCacheKey),w.join()}function y(v,w){v.push(w.precision),v.push(w.outputColorSpace),v.push(w.envMapMode),v.push(w.envMapCubeUVHeight),v.push(w.mapUv),v.push(w.alphaMapUv),v.push(w.lightMapUv),v.push(w.aoMapUv),v.push(w.bumpMapUv),v.push(w.normalMapUv),v.push(w.displacementMapUv),v.push(w.emissiveMapUv),v.push(w.metalnessMapUv),v.push(w.roughnessMapUv),v.push(w.anisotropyMapUv),v.push(w.clearcoatMapUv),v.push(w.clearcoatNormalMapUv),v.push(w.clearcoatRoughnessMapUv),v.push(w.iridescenceMapUv),v.push(w.iridescenceThicknessMapUv),v.push(w.sheenColorMapUv),v.push(w.sheenRoughnessMapUv),v.push(w.specularMapUv),v.push(w.specularColorMapUv),v.push(w.specularIntensityMapUv),v.push(w.transmissionMapUv),v.push(w.thicknessMapUv),v.push(w.combine),v.push(w.fogExp2),v.push(w.sizeAttenuation),v.push(w.morphTargetsCount),v.push(w.morphAttributeCount),v.push(w.numDirLights),v.push(w.numPointLights),v.push(w.numSpotLights),v.push(w.numSpotLightMaps),v.push(w.numHemiLights),v.push(w.numRectAreaLights),v.push(w.numDirLightShadows),v.push(w.numPointLightShadows),v.push(w.numSpotLightShadows),v.push(w.numSpotLightShadowsWithMaps),v.push(w.numLightProbes),v.push(w.shadowMapType),v.push(w.toneMapping),v.push(w.numClippingPlanes),v.push(w.numClipIntersection),v.push(w.depthPacking)}function S(v,w){o.disableAll(),w.supportsVertexTextures&&o.enable(0),w.instancing&&o.enable(1),w.instancingColor&&o.enable(2),w.instancingMorph&&o.enable(3),w.matcap&&o.enable(4),w.envMap&&o.enable(5),w.normalMapObjectSpace&&o.enable(6),w.normalMapTangentSpace&&o.enable(7),w.clearcoat&&o.enable(8),w.iridescence&&o.enable(9),w.alphaTest&&o.enable(10),w.vertexColors&&o.enable(11),w.vertexAlphas&&o.enable(12),w.vertexUv1s&&o.enable(13),w.vertexUv2s&&o.enable(14),w.vertexUv3s&&o.enable(15),w.vertexTangents&&o.enable(16),w.anisotropy&&o.enable(17),w.alphaHash&&o.enable(18),w.batching&&o.enable(19),w.dispersion&&o.enable(20),w.batchingColor&&o.enable(21),v.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.reverseDepthBuffer&&o.enable(4),w.skinning&&o.enable(5),w.morphTargets&&o.enable(6),w.morphNormals&&o.enable(7),w.morphColors&&o.enable(8),w.premultipliedAlpha&&o.enable(9),w.shadowMapEnabled&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),w.alphaToCoverage&&o.enable(20),v.push(o.mask)}function N(v){const w=x[v.type];let H;if(w){const G=vn[w];H=hu.clone(G.uniforms)}else H=v.uniforms;return H}function A(v,w){let H;for(let G=0,X=h.length;G<X;G++){const z=h[G];if(z.cacheKey===w){H=z,++H.usedTimes;break}}return H===void 0&&(H=new s_(n,w,v,s),h.push(H)),H}function T(v){if(--v.usedTimes===0){const w=h.indexOf(v);h[w]=h[h.length-1],h.pop(),v.destroy()}}function F(v){l.remove(v)}function K(){l.dispose()}return{getParameters:f,getProgramCacheKey:M,getUniforms:N,acquireProgram:A,releaseProgram:T,releaseShaderCache:F,programs:h,dispose:K}}function h_(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function u_(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Xc(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function jc(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(u,d,m,g,x,p){let f=n[e];return f===void 0?(f={id:u.id,object:u,geometry:d,material:m,groupOrder:g,renderOrder:u.renderOrder,z:x,group:p},n[e]=f):(f.id=u.id,f.object=u,f.geometry=d,f.material=m,f.groupOrder=g,f.renderOrder=u.renderOrder,f.z=x,f.group=p),e++,f}function o(u,d,m,g,x,p){const f=a(u,d,m,g,x,p);m.transmission>0?i.push(f):m.transparent===!0?r.push(f):t.push(f)}function l(u,d,m,g,x,p){const f=a(u,d,m,g,x,p);m.transmission>0?i.unshift(f):m.transparent===!0?r.unshift(f):t.unshift(f)}function c(u,d){t.length>1&&t.sort(u||u_),i.length>1&&i.sort(d||Xc),r.length>1&&r.sort(d||Xc)}function h(){for(let u=e,d=n.length;u<d;u++){const m=n[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:o,unshift:l,finish:h,sort:c}}function d_(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new jc,n.set(i,[a])):r>=s.length?(a=new jc,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function p_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new L,color:new we};break;case"SpotLight":t={position:new L,direction:new L,color:new we,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new L,color:new we,distance:0,decay:0};break;case"HemisphereLight":t={direction:new L,skyColor:new we,groundColor:new we};break;case"RectAreaLight":t={color:new we,position:new L,halfWidth:new L,halfHeight:new L};break}return n[e.id]=t,t}}}function f_(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ye,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let m_=0;function v_(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function g_(n){const e=new p_,t=f_(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new L);const r=new L,s=new $e,a=new $e;function o(c){let h=0,u=0,d=0;for(let K=0;K<9;K++)i.probe[K].set(0,0,0);let m=0,g=0,x=0,p=0,f=0,M=0,y=0,S=0,N=0,A=0,T=0;c.sort(v_);for(let K=0,v=c.length;K<v;K++){const w=c[K],H=w.color,G=w.intensity,X=w.distance,z=w.shadow&&w.shadow.map?w.shadow.map.texture:null;if(w.isAmbientLight)h+=H.r*G,u+=H.g*G,d+=H.b*G;else if(w.isLightProbe){for(let C=0;C<9;C++)i.probe[C].addScaledVector(w.sh.coefficients[C],G);T++}else if(w.isDirectionalLight){const C=e.get(w);if(C.color.copy(w.color).multiplyScalar(w.intensity),w.castShadow){const V=w.shadow,U=t.get(w);U.shadowIntensity=V.intensity,U.shadowBias=V.bias,U.shadowNormalBias=V.normalBias,U.shadowRadius=V.radius,U.shadowMapSize=V.mapSize,i.directionalShadow[m]=U,i.directionalShadowMap[m]=z,i.directionalShadowMatrix[m]=w.shadow.matrix,M++}i.directional[m]=C,m++}else if(w.isSpotLight){const C=e.get(w);C.position.setFromMatrixPosition(w.matrixWorld),C.color.copy(H).multiplyScalar(G),C.distance=X,C.coneCos=Math.cos(w.angle),C.penumbraCos=Math.cos(w.angle*(1-w.penumbra)),C.decay=w.decay,i.spot[x]=C;const V=w.shadow;if(w.map&&(i.spotLightMap[N]=w.map,N++,V.updateMatrices(w),w.castShadow&&A++),i.spotLightMatrix[x]=V.matrix,w.castShadow){const U=t.get(w);U.shadowIntensity=V.intensity,U.shadowBias=V.bias,U.shadowNormalBias=V.normalBias,U.shadowRadius=V.radius,U.shadowMapSize=V.mapSize,i.spotShadow[x]=U,i.spotShadowMap[x]=z,S++}x++}else if(w.isRectAreaLight){const C=e.get(w);C.color.copy(H).multiplyScalar(G),C.halfWidth.set(w.width*.5,0,0),C.halfHeight.set(0,w.height*.5,0),i.rectArea[p]=C,p++}else if(w.isPointLight){const C=e.get(w);if(C.color.copy(w.color).multiplyScalar(w.intensity),C.distance=w.distance,C.decay=w.decay,w.castShadow){const V=w.shadow,U=t.get(w);U.shadowIntensity=V.intensity,U.shadowBias=V.bias,U.shadowNormalBias=V.normalBias,U.shadowRadius=V.radius,U.shadowMapSize=V.mapSize,U.shadowCameraNear=V.camera.near,U.shadowCameraFar=V.camera.far,i.pointShadow[g]=U,i.pointShadowMap[g]=z,i.pointShadowMatrix[g]=w.shadow.matrix,y++}i.point[g]=C,g++}else if(w.isHemisphereLight){const C=e.get(w);C.skyColor.copy(w.color).multiplyScalar(G),C.groundColor.copy(w.groundColor).multiplyScalar(G),i.hemi[f]=C,f++}}p>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=re.LTC_FLOAT_1,i.rectAreaLTC2=re.LTC_FLOAT_2):(i.rectAreaLTC1=re.LTC_HALF_1,i.rectAreaLTC2=re.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;const F=i.hash;(F.directionalLength!==m||F.pointLength!==g||F.spotLength!==x||F.rectAreaLength!==p||F.hemiLength!==f||F.numDirectionalShadows!==M||F.numPointShadows!==y||F.numSpotShadows!==S||F.numSpotMaps!==N||F.numLightProbes!==T)&&(i.directional.length=m,i.spot.length=x,i.rectArea.length=p,i.point.length=g,i.hemi.length=f,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=y,i.pointShadowMap.length=y,i.spotShadow.length=S,i.spotShadowMap.length=S,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=y,i.spotLightMatrix.length=S+N-A,i.spotLightMap.length=N,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=T,F.directionalLength=m,F.pointLength=g,F.spotLength=x,F.rectAreaLength=p,F.hemiLength=f,F.numDirectionalShadows=M,F.numPointShadows=y,F.numSpotShadows=S,F.numSpotMaps=N,F.numLightProbes=T,i.version=m_++)}function l(c,h){let u=0,d=0,m=0,g=0,x=0;const p=h.matrixWorldInverse;for(let f=0,M=c.length;f<M;f++){const y=c[f];if(y.isDirectionalLight){const S=i.directional[u];S.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(p),u++}else if(y.isSpotLight){const S=i.spot[m];S.position.setFromMatrixPosition(y.matrixWorld),S.position.applyMatrix4(p),S.direction.setFromMatrixPosition(y.matrixWorld),r.setFromMatrixPosition(y.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(p),m++}else if(y.isRectAreaLight){const S=i.rectArea[g];S.position.setFromMatrixPosition(y.matrixWorld),S.position.applyMatrix4(p),a.identity(),s.copy(y.matrixWorld),s.premultiply(p),a.extractRotation(s),S.halfWidth.set(y.width*.5,0,0),S.halfHeight.set(0,y.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),g++}else if(y.isPointLight){const S=i.point[d];S.position.setFromMatrixPosition(y.matrixWorld),S.position.applyMatrix4(p),d++}else if(y.isHemisphereLight){const S=i.hemi[x];S.direction.setFromMatrixPosition(y.matrixWorld),S.direction.transformDirection(p),x++}}}return{setup:o,setupView:l,state:i}}function Kc(n){const e=new g_(n),t=[],i=[];function r(h){c.camera=h,t.length=0,i.length=0}function s(h){t.push(h)}function a(h){i.push(h)}function o(){e.setup(t)}function l(h){e.setupView(t,h)}const c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function __(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Kc(n),e.set(r,[o])):s>=a.length?(o=new Kc(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}class x_ extends ra{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=dp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class b_ extends ra{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const y_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,w_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function S_(n,e,t){let i=new ml;const r=new ye,s=new ye,a=new at,o=new x_({depthPacking:pp}),l=new b_,c={},h=t.maxTextureSize,u={[ni]:zt,[zt]:ni,[pn]:pn},d=new mt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ye},radius:{value:4}},vertexShader:y_,fragmentShader:w_}),m=d.clone();m.defines.HORIZONTAL_PASS=1;const g=new Zt;g.setAttribute("position",new St(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new ut(g,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Hh;let f=this.type;this.render=function(A,T,F){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;const K=n.getRenderTarget(),v=n.getActiveCubeFace(),w=n.getActiveMipmapLevel(),H=n.state;H.setBlending(Fn),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);const G=f!==Rn&&this.type===Rn,X=f===Rn&&this.type!==Rn;for(let z=0,C=A.length;z<C;z++){const V=A[z],U=V.shadow;if(U===void 0){console.warn("THREE.WebGLShadowMap:",V,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;r.copy(U.mapSize);const ee=U.getFrameExtents();if(r.multiply(ee),s.copy(U.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/ee.x),r.x=s.x*ee.x,U.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/ee.y),r.y=s.y*ee.y,U.mapSize.y=s.y)),U.map===null||G===!0||X===!0){const Z=this.type!==Rn?{minFilter:ct,magFilter:ct}:{};U.map!==null&&U.map.dispose(),U.map=new bn(r.x,r.y,Z),U.map.texture.name=V.name+".shadowMap",U.camera.updateProjectionMatrix()}n.setRenderTarget(U.map),n.clear();const Q=U.getViewportCount();for(let Z=0;Z<Q;Z++){const ge=U.getViewport(Z);a.set(s.x*ge.x,s.y*ge.y,s.x*ge.z,s.y*ge.w),H.viewport(a),U.updateMatrices(V,Z),i=U.getFrustum(),S(T,F,U.camera,V,this.type)}U.isPointLightShadow!==!0&&this.type===Rn&&M(U,F),U.needsUpdate=!1}f=this.type,p.needsUpdate=!1,n.setRenderTarget(K,v,w)};function M(A,T){const F=e.update(x);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,m.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new bn(r.x,r.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,n.setRenderTarget(A.mapPass),n.clear(),n.renderBufferDirect(T,null,F,d,x,null),m.uniforms.shadow_pass.value=A.mapPass.texture,m.uniforms.resolution.value=A.mapSize,m.uniforms.radius.value=A.radius,n.setRenderTarget(A.map),n.clear(),n.renderBufferDirect(T,null,F,m,x,null)}function y(A,T,F,K){let v=null;const w=F.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(w!==void 0)v=w;else if(v=F.isPointLight===!0?l:o,n.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){const H=v.uuid,G=T.uuid;let X=c[H];X===void 0&&(X={},c[H]=X);let z=X[G];z===void 0&&(z=v.clone(),X[G]=z,T.addEventListener("dispose",N)),v=z}if(v.visible=T.visible,v.wireframe=T.wireframe,K===Rn?v.side=T.shadowSide!==null?T.shadowSide:T.side:v.side=T.shadowSide!==null?T.shadowSide:u[T.side],v.alphaMap=T.alphaMap,v.alphaTest=T.alphaTest,v.map=T.map,v.clipShadows=T.clipShadows,v.clippingPlanes=T.clippingPlanes,v.clipIntersection=T.clipIntersection,v.displacementMap=T.displacementMap,v.displacementScale=T.displacementScale,v.displacementBias=T.displacementBias,v.wireframeLinewidth=T.wireframeLinewidth,v.linewidth=T.linewidth,F.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const H=n.properties.get(v);H.light=F}return v}function S(A,T,F,K,v){if(A.visible===!1)return;if(A.layers.test(T.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&v===Rn)&&(!A.frustumCulled||i.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,A.matrixWorld);const G=e.update(A),X=A.material;if(Array.isArray(X)){const z=G.groups;for(let C=0,V=z.length;C<V;C++){const U=z[C],ee=X[U.materialIndex];if(ee&&ee.visible){const Q=y(A,ee,K,v);A.onBeforeShadow(n,A,T,F,G,Q,U),n.renderBufferDirect(F,null,G,Q,A,U),A.onAfterShadow(n,A,T,F,G,Q,U)}}}else if(X.visible){const z=y(A,X,K,v);A.onBeforeShadow(n,A,T,F,G,z,null),n.renderBufferDirect(F,null,G,z,A,null),A.onAfterShadow(n,A,T,F,G,z,null)}}const H=A.children;for(let G=0,X=H.length;G<X;G++)S(H[G],T,F,K,v)}function N(A){A.target.removeEventListener("dispose",N);for(const F in c){const K=c[F],v=A.target.uuid;v in K&&(K[v].dispose(),delete K[v])}}}const M_={[po]:fo,[mo]:_o,[vo]:xo,[cr]:go,[fo]:po,[_o]:mo,[xo]:vo,[go]:cr};function E_(n){function e(){let R=!1;const le=new at;let W=null;const $=new at(0,0,0,0);return{setMask:function(ae){W!==ae&&!R&&(n.colorMask(ae,ae,ae,ae),W=ae)},setLocked:function(ae){R=ae},setClear:function(ae,ce,ze,pt,Nt){Nt===!0&&(ae*=pt,ce*=pt,ze*=pt),le.set(ae,ce,ze,pt),$.equals(le)===!1&&(n.clearColor(ae,ce,ze,pt),$.copy(le))},reset:function(){R=!1,W=null,$.set(-1,0,0,0)}}}function t(){let R=!1,le=!1,W=null,$=null,ae=null;return{setReversed:function(ce){le=ce},setTest:function(ce){ce?me(n.DEPTH_TEST):he(n.DEPTH_TEST)},setMask:function(ce){W!==ce&&!R&&(n.depthMask(ce),W=ce)},setFunc:function(ce){if(le&&(ce=M_[ce]),$!==ce){switch(ce){case po:n.depthFunc(n.NEVER);break;case fo:n.depthFunc(n.ALWAYS);break;case mo:n.depthFunc(n.LESS);break;case cr:n.depthFunc(n.LEQUAL);break;case vo:n.depthFunc(n.EQUAL);break;case go:n.depthFunc(n.GEQUAL);break;case _o:n.depthFunc(n.GREATER);break;case xo:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}$=ce}},setLocked:function(ce){R=ce},setClear:function(ce){ae!==ce&&(n.clearDepth(ce),ae=ce)},reset:function(){R=!1,W=null,$=null,ae=null}}}function i(){let R=!1,le=null,W=null,$=null,ae=null,ce=null,ze=null,pt=null,Nt=null;return{setTest:function(Xe){R||(Xe?me(n.STENCIL_TEST):he(n.STENCIL_TEST))},setMask:function(Xe){le!==Xe&&!R&&(n.stencilMask(Xe),le=Xe)},setFunc:function(Xe,Ft,Sn){(W!==Xe||$!==Ft||ae!==Sn)&&(n.stencilFunc(Xe,Ft,Sn),W=Xe,$=Ft,ae=Sn)},setOp:function(Xe,Ft,Sn){(ce!==Xe||ze!==Ft||pt!==Sn)&&(n.stencilOp(Xe,Ft,Sn),ce=Xe,ze=Ft,pt=Sn)},setLocked:function(Xe){R=Xe},setClear:function(Xe){Nt!==Xe&&(n.clearStencil(Xe),Nt=Xe)},reset:function(){R=!1,le=null,W=null,$=null,ae=null,ce=null,ze=null,pt=null,Nt=null}}}const r=new e,s=new t,a=new i,o=new WeakMap,l=new WeakMap;let c={},h={},u=new WeakMap,d=[],m=null,g=!1,x=null,p=null,f=null,M=null,y=null,S=null,N=null,A=new we(0,0,0),T=0,F=!1,K=null,v=null,w=null,H=null,G=null;const X=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let z=!1,C=0;const V=n.getParameter(n.VERSION);V.indexOf("WebGL")!==-1?(C=parseFloat(/^WebGL (\d)/.exec(V)[1]),z=C>=1):V.indexOf("OpenGL ES")!==-1&&(C=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),z=C>=2);let U=null,ee={};const Q=n.getParameter(n.SCISSOR_BOX),Z=n.getParameter(n.VIEWPORT),ge=new at().fromArray(Q),Pe=new at().fromArray(Z);function j(R,le,W,$){const ae=new Uint8Array(4),ce=n.createTexture();n.bindTexture(R,ce),n.texParameteri(R,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(R,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ze=0;ze<W;ze++)R===n.TEXTURE_3D||R===n.TEXTURE_2D_ARRAY?n.texImage3D(le,0,n.RGBA,1,1,$,0,n.RGBA,n.UNSIGNED_BYTE,ae):n.texImage2D(le+ze,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,ae);return ce}const te={};te[n.TEXTURE_2D]=j(n.TEXTURE_2D,n.TEXTURE_2D,1),te[n.TEXTURE_CUBE_MAP]=j(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),te[n.TEXTURE_2D_ARRAY]=j(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),te[n.TEXTURE_3D]=j(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),s.setClear(1),a.setClear(0),me(n.DEPTH_TEST),s.setFunc(cr),Fe(!1),He(ic),me(n.CULL_FACE),P(Fn);function me(R){c[R]!==!0&&(n.enable(R),c[R]=!0)}function he(R){c[R]!==!1&&(n.disable(R),c[R]=!1)}function De(R,le){return h[R]!==le?(n.bindFramebuffer(R,le),h[R]=le,R===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=le),R===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=le),!0):!1}function Me(R,le){let W=d,$=!1;if(R){W=u.get(le),W===void 0&&(W=[],u.set(le,W));const ae=R.textures;if(W.length!==ae.length||W[0]!==n.COLOR_ATTACHMENT0){for(let ce=0,ze=ae.length;ce<ze;ce++)W[ce]=n.COLOR_ATTACHMENT0+ce;W.length=ae.length,$=!0}}else W[0]!==n.BACK&&(W[0]=n.BACK,$=!0);$&&n.drawBuffers(W)}function ke(R){return m!==R?(n.useProgram(R),m=R,!0):!1}const Je={[_i]:n.FUNC_ADD,[Vd]:n.FUNC_SUBTRACT,[Hd]:n.FUNC_REVERSE_SUBTRACT};Je[Gd]=n.MIN,Je[Wd]=n.MAX;const Be={[Xd]:n.ZERO,[ho]:n.ONE,[jd]:n.SRC_COLOR,[uo]:n.SRC_ALPHA,[Jd]:n.SRC_ALPHA_SATURATE,[$d]:n.DST_COLOR,[qd]:n.DST_ALPHA,[Kd]:n.ONE_MINUS_SRC_COLOR,[Br]:n.ONE_MINUS_SRC_ALPHA,[Zd]:n.ONE_MINUS_DST_COLOR,[Yd]:n.ONE_MINUS_DST_ALPHA,[Qd]:n.CONSTANT_COLOR,[ep]:n.ONE_MINUS_CONSTANT_COLOR,[tp]:n.CONSTANT_ALPHA,[np]:n.ONE_MINUS_CONSTANT_ALPHA};function P(R,le,W,$,ae,ce,ze,pt,Nt,Xe){if(R===Fn){g===!0&&(he(n.BLEND),g=!1);return}if(g===!1&&(me(n.BLEND),g=!0),R!==Gh){if(R!==x||Xe!==F){if((p!==_i||y!==_i)&&(n.blendEquation(n.FUNC_ADD),p=_i,y=_i),Xe)switch(R){case yi:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case lr:n.blendFunc(n.ONE,n.ONE);break;case rc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case sc:n.blendFuncSeparate(n.ZERO,n.SRC_COLOR,n.ZERO,n.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}else switch(R){case yi:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case lr:n.blendFunc(n.SRC_ALPHA,n.ONE);break;case rc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case sc:n.blendFunc(n.ZERO,n.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}f=null,M=null,S=null,N=null,A.set(0,0,0),T=0,x=R,F=Xe}return}ae=ae||le,ce=ce||W,ze=ze||$,(le!==p||ae!==y)&&(n.blendEquationSeparate(Je[le],Je[ae]),p=le,y=ae),(W!==f||$!==M||ce!==S||ze!==N)&&(n.blendFuncSeparate(Be[W],Be[$],Be[ce],Be[ze]),f=W,M=$,S=ce,N=ze),(pt.equals(A)===!1||Nt!==T)&&(n.blendColor(pt.r,pt.g,pt.b,Nt),A.copy(pt),T=Nt),x=R,F=!1}function Gt(R,le){R.side===pn?he(n.CULL_FACE):me(n.CULL_FACE);let W=R.side===zt;le&&(W=!W),Fe(W),R.blending===yi&&R.transparent===!1?P(Fn):P(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.blendColor,R.blendAlpha,R.premultipliedAlpha),s.setFunc(R.depthFunc),s.setTest(R.depthTest),s.setMask(R.depthWrite),r.setMask(R.colorWrite);const $=R.stencilWrite;a.setTest($),$&&(a.setMask(R.stencilWriteMask),a.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),a.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),nt(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?me(n.SAMPLE_ALPHA_TO_COVERAGE):he(n.SAMPLE_ALPHA_TO_COVERAGE)}function Fe(R){K!==R&&(R?n.frontFace(n.CW):n.frontFace(n.CCW),K=R)}function He(R){R!==kd?(me(n.CULL_FACE),R!==v&&(R===ic?n.cullFace(n.BACK):R===Bd?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):he(n.CULL_FACE),v=R}function Te(R){R!==w&&(z&&n.lineWidth(R),w=R)}function nt(R,le,W){R?(me(n.POLYGON_OFFSET_FILL),(H!==le||G!==W)&&(n.polygonOffset(le,W),H=le,G=W)):he(n.POLYGON_OFFSET_FILL)}function Re(R){R?me(n.SCISSOR_TEST):he(n.SCISSOR_TEST)}function E(R){R===void 0&&(R=n.TEXTURE0+X-1),U!==R&&(n.activeTexture(R),U=R)}function _(R,le,W){W===void 0&&(U===null?W=n.TEXTURE0+X-1:W=U);let $=ee[W];$===void 0&&($={type:void 0,texture:void 0},ee[W]=$),($.type!==R||$.texture!==le)&&(U!==W&&(n.activeTexture(W),U=W),n.bindTexture(R,le||te[R]),$.type=R,$.texture=le)}function O(){const R=ee[U];R!==void 0&&R.type!==void 0&&(n.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function Y(){try{n.compressedTexImage2D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function J(){try{n.compressedTexImage3D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function q(){try{n.texSubImage2D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function _e(){try{n.texSubImage3D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function se(){try{n.compressedTexSubImage2D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ue(){try{n.compressedTexSubImage3D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Ge(){try{n.texStorage2D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ne(){try{n.texStorage3D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function de(){try{n.texImage2D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Ce(){try{n.texImage3D.apply(n,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function Ae(R){ge.equals(R)===!1&&(n.scissor(R.x,R.y,R.z,R.w),ge.copy(R))}function pe(R){Pe.equals(R)===!1&&(n.viewport(R.x,R.y,R.z,R.w),Pe.copy(R))}function Oe(R,le){let W=l.get(le);W===void 0&&(W=new WeakMap,l.set(le,W));let $=W.get(R);$===void 0&&($=n.getUniformBlockIndex(le,R.name),W.set(R,$))}function Le(R,le){const $=l.get(le).get(R);o.get(le)!==$&&(n.uniformBlockBinding(le,$,R.__bindingPointIndex),o.set(le,$))}function et(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),c={},U=null,ee={},h={},u=new WeakMap,d=[],m=null,g=!1,x=null,p=null,f=null,M=null,y=null,S=null,N=null,A=new we(0,0,0),T=0,F=!1,K=null,v=null,w=null,H=null,G=null,ge.set(0,0,n.canvas.width,n.canvas.height),Pe.set(0,0,n.canvas.width,n.canvas.height),r.reset(),s.reset(),a.reset()}return{buffers:{color:r,depth:s,stencil:a},enable:me,disable:he,bindFramebuffer:De,drawBuffers:Me,useProgram:ke,setBlending:P,setMaterial:Gt,setFlipSided:Fe,setCullFace:He,setLineWidth:Te,setPolygonOffset:nt,setScissorTest:Re,activeTexture:E,bindTexture:_,unbindTexture:O,compressedTexImage2D:Y,compressedTexImage3D:J,texImage2D:de,texImage3D:Ce,updateUBOMapping:Oe,uniformBlockBinding:Le,texStorage2D:Ge,texStorage3D:ne,texSubImage2D:q,texSubImage3D:_e,compressedTexSubImage2D:se,compressedTexSubImage3D:ue,scissor:Ae,viewport:pe,reset:et}}function qc(n,e,t,i){const r=T_(i);switch(t){case $h:return n*e;case Jh:return n*e;case Qh:return n*e*2;case Vr:return n*e/r.components*r.byteLength;case na:return n*e/r.components*r.byteLength;case qr:return n*e*2/r.components*r.byteLength;case hl:return n*e*2/r.components*r.byteLength;case Zh:return n*e*3/r.components*r.byteLength;case Yt:return n*e*4/r.components*r.byteLength;case ul:return n*e*4/r.components*r.byteLength;case Ns:case Fs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Os:case ks:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Mo:case To:return Math.max(n,16)*Math.max(e,8)/4;case So:case Eo:return Math.max(n,8)*Math.max(e,8)/2;case Co:case Ao:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Po:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ro:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Do:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Lo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Io:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Uo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case No:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Fo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Oo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case ko:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Bo:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case zo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Vo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Ho:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Go:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Bs:case Wo:case Xo:return Math.ceil(n/4)*Math.ceil(e/4)*16;case eu:case jo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ko:case qo:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function T_(n){switch(n){case xn:case Kh:return{byteLength:1,components:1};case zr:case qh:case $t:return{byteLength:2,components:1};case ll:case cl:return{byteLength:2,components:4};case ii:case ol:case mn:return{byteLength:4,components:1};case Yh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}function C_(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ye,h=new WeakMap;let u;const d=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,_){return m?new OffscreenCanvas(E,_):Ys("canvas")}function x(E,_,O){let Y=1;const J=Re(E);if((J.width>O||J.height>O)&&(Y=O/Math.max(J.width,J.height)),Y<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const q=Math.floor(Y*J.width),_e=Math.floor(Y*J.height);u===void 0&&(u=g(q,_e));const se=_?g(q,_e):u;return se.width=q,se.height=_e,se.getContext("2d").drawImage(E,0,0,q,_e),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+q+"x"+_e+")."),se}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),E;return E}function p(E){return E.generateMipmaps&&E.minFilter!==ct&&E.minFilter!==Tt}function f(E){n.generateMipmap(E)}function M(E,_,O,Y,J=!1){if(E!==null){if(n[E]!==void 0)return n[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let q=_;if(_===n.RED&&(O===n.FLOAT&&(q=n.R32F),O===n.HALF_FLOAT&&(q=n.R16F),O===n.UNSIGNED_BYTE&&(q=n.R8)),_===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(q=n.R8UI),O===n.UNSIGNED_SHORT&&(q=n.R16UI),O===n.UNSIGNED_INT&&(q=n.R32UI),O===n.BYTE&&(q=n.R8I),O===n.SHORT&&(q=n.R16I),O===n.INT&&(q=n.R32I)),_===n.RG&&(O===n.FLOAT&&(q=n.RG32F),O===n.HALF_FLOAT&&(q=n.RG16F),O===n.UNSIGNED_BYTE&&(q=n.RG8)),_===n.RG_INTEGER&&(O===n.UNSIGNED_BYTE&&(q=n.RG8UI),O===n.UNSIGNED_SHORT&&(q=n.RG16UI),O===n.UNSIGNED_INT&&(q=n.RG32UI),O===n.BYTE&&(q=n.RG8I),O===n.SHORT&&(q=n.RG16I),O===n.INT&&(q=n.RG32I)),_===n.RGB_INTEGER&&(O===n.UNSIGNED_BYTE&&(q=n.RGB8UI),O===n.UNSIGNED_SHORT&&(q=n.RGB16UI),O===n.UNSIGNED_INT&&(q=n.RGB32UI),O===n.BYTE&&(q=n.RGB8I),O===n.SHORT&&(q=n.RGB16I),O===n.INT&&(q=n.RGB32I)),_===n.RGBA_INTEGER&&(O===n.UNSIGNED_BYTE&&(q=n.RGBA8UI),O===n.UNSIGNED_SHORT&&(q=n.RGBA16UI),O===n.UNSIGNED_INT&&(q=n.RGBA32UI),O===n.BYTE&&(q=n.RGBA8I),O===n.SHORT&&(q=n.RGBA16I),O===n.INT&&(q=n.RGBA32I)),_===n.RGB&&O===n.UNSIGNED_INT_5_9_9_9_REV&&(q=n.RGB9_E5),_===n.RGBA){const _e=J?Xs:qe.getTransfer(Y);O===n.FLOAT&&(q=n.RGBA32F),O===n.HALF_FLOAT&&(q=n.RGBA16F),O===n.UNSIGNED_BYTE&&(q=_e===rt?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT_4_4_4_4&&(q=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(q=n.RGB5_A1)}return(q===n.R16F||q===n.R32F||q===n.RG16F||q===n.RG32F||q===n.RGBA16F||q===n.RGBA32F)&&e.get("EXT_color_buffer_float"),q}function y(E,_){let O;return E?_===null||_===ii||_===pr?O=n.DEPTH24_STENCIL8:_===mn?O=n.DEPTH32F_STENCIL8:_===zr&&(O=n.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===ii||_===pr?O=n.DEPTH_COMPONENT24:_===mn?O=n.DEPTH_COMPONENT32F:_===zr&&(O=n.DEPTH_COMPONENT16),O}function S(E,_){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==ct&&E.minFilter!==Tt?Math.log2(Math.max(_.width,_.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?_.mipmaps.length:1}function N(E){const _=E.target;_.removeEventListener("dispose",N),T(_),_.isVideoTexture&&h.delete(_)}function A(E){const _=E.target;_.removeEventListener("dispose",A),K(_)}function T(E){const _=i.get(E);if(_.__webglInit===void 0)return;const O=E.source,Y=d.get(O);if(Y){const J=Y[_.__cacheKey];J.usedTimes--,J.usedTimes===0&&F(E),Object.keys(Y).length===0&&d.delete(O)}i.remove(E)}function F(E){const _=i.get(E);n.deleteTexture(_.__webglTexture);const O=E.source,Y=d.get(O);delete Y[_.__cacheKey],a.memory.textures--}function K(E){const _=i.get(E);if(E.depthTexture&&E.depthTexture.dispose(),E.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(_.__webglFramebuffer[Y]))for(let J=0;J<_.__webglFramebuffer[Y].length;J++)n.deleteFramebuffer(_.__webglFramebuffer[Y][J]);else n.deleteFramebuffer(_.__webglFramebuffer[Y]);_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer[Y])}else{if(Array.isArray(_.__webglFramebuffer))for(let Y=0;Y<_.__webglFramebuffer.length;Y++)n.deleteFramebuffer(_.__webglFramebuffer[Y]);else n.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&n.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&n.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let Y=0;Y<_.__webglColorRenderbuffer.length;Y++)_.__webglColorRenderbuffer[Y]&&n.deleteRenderbuffer(_.__webglColorRenderbuffer[Y]);_.__webglDepthRenderbuffer&&n.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const O=E.textures;for(let Y=0,J=O.length;Y<J;Y++){const q=i.get(O[Y]);q.__webglTexture&&(n.deleteTexture(q.__webglTexture),a.memory.textures--),i.remove(O[Y])}i.remove(E)}let v=0;function w(){v=0}function H(){const E=v;return E>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+r.maxTextures),v+=1,E}function G(E){const _=[];return _.push(E.wrapS),_.push(E.wrapT),_.push(E.wrapR||0),_.push(E.magFilter),_.push(E.minFilter),_.push(E.anisotropy),_.push(E.internalFormat),_.push(E.format),_.push(E.type),_.push(E.generateMipmaps),_.push(E.premultiplyAlpha),_.push(E.flipY),_.push(E.unpackAlignment),_.push(E.colorSpace),_.join()}function X(E,_){const O=i.get(E);if(E.isVideoTexture&&Te(E),E.isRenderTargetTexture===!1&&E.version>0&&O.__version!==E.version){const Y=E.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Pe(O,E,_);return}}t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+_)}function z(E,_){const O=i.get(E);if(E.version>0&&O.__version!==E.version){Pe(O,E,_);return}t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+_)}function C(E,_){const O=i.get(E);if(E.version>0&&O.__version!==E.version){Pe(O,E,_);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+_)}function V(E,_){const O=i.get(E);if(E.version>0&&O.__version!==E.version){j(O,E,_);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+_)}const U={[dr]:n.REPEAT,[_t]:n.CLAMP_TO_EDGE,[wo]:n.MIRRORED_REPEAT},ee={[ct]:n.NEAREST,[up]:n.NEAREST_MIPMAP_NEAREST,[hs]:n.NEAREST_MIPMAP_LINEAR,[Tt]:n.LINEAR,[ba]:n.LINEAR_MIPMAP_NEAREST,[bi]:n.LINEAR_MIPMAP_LINEAR},Q={[vp]:n.NEVER,[wp]:n.ALWAYS,[gp]:n.LESS,[tu]:n.LEQUAL,[_p]:n.EQUAL,[yp]:n.GEQUAL,[xp]:n.GREATER,[bp]:n.NOTEQUAL};function Z(E,_){if(_.type===mn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===Tt||_.magFilter===ba||_.magFilter===hs||_.magFilter===bi||_.minFilter===Tt||_.minFilter===ba||_.minFilter===hs||_.minFilter===bi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(E,n.TEXTURE_WRAP_S,U[_.wrapS]),n.texParameteri(E,n.TEXTURE_WRAP_T,U[_.wrapT]),(E===n.TEXTURE_3D||E===n.TEXTURE_2D_ARRAY)&&n.texParameteri(E,n.TEXTURE_WRAP_R,U[_.wrapR]),n.texParameteri(E,n.TEXTURE_MAG_FILTER,ee[_.magFilter]),n.texParameteri(E,n.TEXTURE_MIN_FILTER,ee[_.minFilter]),_.compareFunction&&(n.texParameteri(E,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(E,n.TEXTURE_COMPARE_FUNC,Q[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===ct||_.minFilter!==hs&&_.minFilter!==bi||_.type===mn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){const O=e.get("EXT_texture_filter_anisotropic");n.texParameterf(E,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,r.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function ge(E,_){let O=!1;E.__webglInit===void 0&&(E.__webglInit=!0,_.addEventListener("dispose",N));const Y=_.source;let J=d.get(Y);J===void 0&&(J={},d.set(Y,J));const q=G(_);if(q!==E.__cacheKey){J[q]===void 0&&(J[q]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,O=!0),J[q].usedTimes++;const _e=J[E.__cacheKey];_e!==void 0&&(J[E.__cacheKey].usedTimes--,_e.usedTimes===0&&F(_)),E.__cacheKey=q,E.__webglTexture=J[q].texture}return O}function Pe(E,_,O){let Y=n.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(Y=n.TEXTURE_2D_ARRAY),_.isData3DTexture&&(Y=n.TEXTURE_3D);const J=ge(E,_),q=_.source;t.bindTexture(Y,E.__webglTexture,n.TEXTURE0+O);const _e=i.get(q);if(q.version!==_e.__version||J===!0){t.activeTexture(n.TEXTURE0+O);const se=qe.getPrimaries(qe.workingColorSpace),ue=_.colorSpace===Dn?null:qe.getPrimaries(_.colorSpace),Ge=_.colorSpace===Dn||se===ue?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ge);let ne=x(_.image,!1,r.maxTextureSize);ne=nt(_,ne);const de=s.convert(_.format,_.colorSpace),Ce=s.convert(_.type);let Ae=M(_.internalFormat,de,Ce,_.colorSpace,_.isVideoTexture);Z(Y,_);let pe;const Oe=_.mipmaps,Le=_.isVideoTexture!==!0,et=_e.__version===void 0||J===!0,R=q.dataReady,le=S(_,ne);if(_.isDepthTexture)Ae=y(_.format===fr,_.type),et&&(Le?t.texStorage2D(n.TEXTURE_2D,1,Ae,ne.width,ne.height):t.texImage2D(n.TEXTURE_2D,0,Ae,ne.width,ne.height,0,de,Ce,null));else if(_.isDataTexture)if(Oe.length>0){Le&&et&&t.texStorage2D(n.TEXTURE_2D,le,Ae,Oe[0].width,Oe[0].height);for(let W=0,$=Oe.length;W<$;W++)pe=Oe[W],Le?R&&t.texSubImage2D(n.TEXTURE_2D,W,0,0,pe.width,pe.height,de,Ce,pe.data):t.texImage2D(n.TEXTURE_2D,W,Ae,pe.width,pe.height,0,de,Ce,pe.data);_.generateMipmaps=!1}else Le?(et&&t.texStorage2D(n.TEXTURE_2D,le,Ae,ne.width,ne.height),R&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ne.width,ne.height,de,Ce,ne.data)):t.texImage2D(n.TEXTURE_2D,0,Ae,ne.width,ne.height,0,de,Ce,ne.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Le&&et&&t.texStorage3D(n.TEXTURE_2D_ARRAY,le,Ae,Oe[0].width,Oe[0].height,ne.depth);for(let W=0,$=Oe.length;W<$;W++)if(pe=Oe[W],_.format!==Yt)if(de!==null)if(Le){if(R)if(_.layerUpdates.size>0){const ae=qc(pe.width,pe.height,_.format,_.type);for(const ce of _.layerUpdates){const ze=pe.data.subarray(ce*ae/pe.data.BYTES_PER_ELEMENT,(ce+1)*ae/pe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,W,0,0,ce,pe.width,pe.height,1,de,ze,0,0)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,W,0,0,0,pe.width,pe.height,ne.depth,de,pe.data,0,0)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,W,Ae,pe.width,pe.height,ne.depth,0,pe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Le?R&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,W,0,0,0,pe.width,pe.height,ne.depth,de,Ce,pe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,W,Ae,pe.width,pe.height,ne.depth,0,de,Ce,pe.data)}else{Le&&et&&t.texStorage2D(n.TEXTURE_2D,le,Ae,Oe[0].width,Oe[0].height);for(let W=0,$=Oe.length;W<$;W++)pe=Oe[W],_.format!==Yt?de!==null?Le?R&&t.compressedTexSubImage2D(n.TEXTURE_2D,W,0,0,pe.width,pe.height,de,pe.data):t.compressedTexImage2D(n.TEXTURE_2D,W,Ae,pe.width,pe.height,0,pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Le?R&&t.texSubImage2D(n.TEXTURE_2D,W,0,0,pe.width,pe.height,de,Ce,pe.data):t.texImage2D(n.TEXTURE_2D,W,Ae,pe.width,pe.height,0,de,Ce,pe.data)}else if(_.isDataArrayTexture)if(Le){if(et&&t.texStorage3D(n.TEXTURE_2D_ARRAY,le,Ae,ne.width,ne.height,ne.depth),R)if(_.layerUpdates.size>0){const W=qc(ne.width,ne.height,_.format,_.type);for(const $ of _.layerUpdates){const ae=ne.data.subarray($*W/ne.data.BYTES_PER_ELEMENT,($+1)*W/ne.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,$,ne.width,ne.height,1,de,Ce,ae)}_.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ne.width,ne.height,ne.depth,de,Ce,ne.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ae,ne.width,ne.height,ne.depth,0,de,Ce,ne.data);else if(_.isData3DTexture)Le?(et&&t.texStorage3D(n.TEXTURE_3D,le,Ae,ne.width,ne.height,ne.depth),R&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ne.width,ne.height,ne.depth,de,Ce,ne.data)):t.texImage3D(n.TEXTURE_3D,0,Ae,ne.width,ne.height,ne.depth,0,de,Ce,ne.data);else if(_.isFramebufferTexture){if(et)if(Le)t.texStorage2D(n.TEXTURE_2D,le,Ae,ne.width,ne.height);else{let W=ne.width,$=ne.height;for(let ae=0;ae<le;ae++)t.texImage2D(n.TEXTURE_2D,ae,Ae,W,$,0,de,Ce,null),W>>=1,$>>=1}}else if(Oe.length>0){if(Le&&et){const W=Re(Oe[0]);t.texStorage2D(n.TEXTURE_2D,le,Ae,W.width,W.height)}for(let W=0,$=Oe.length;W<$;W++)pe=Oe[W],Le?R&&t.texSubImage2D(n.TEXTURE_2D,W,0,0,de,Ce,pe):t.texImage2D(n.TEXTURE_2D,W,Ae,de,Ce,pe);_.generateMipmaps=!1}else if(Le){if(et){const W=Re(ne);t.texStorage2D(n.TEXTURE_2D,le,Ae,W.width,W.height)}R&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,de,Ce,ne)}else t.texImage2D(n.TEXTURE_2D,0,Ae,de,Ce,ne);p(_)&&f(Y),_e.__version=q.version,_.onUpdate&&_.onUpdate(_)}E.__version=_.version}function j(E,_,O){if(_.image.length!==6)return;const Y=ge(E,_),J=_.source;t.bindTexture(n.TEXTURE_CUBE_MAP,E.__webglTexture,n.TEXTURE0+O);const q=i.get(J);if(J.version!==q.__version||Y===!0){t.activeTexture(n.TEXTURE0+O);const _e=qe.getPrimaries(qe.workingColorSpace),se=_.colorSpace===Dn?null:qe.getPrimaries(_.colorSpace),ue=_.colorSpace===Dn||_e===se?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ue);const Ge=_.isCompressedTexture||_.image[0].isCompressedTexture,ne=_.image[0]&&_.image[0].isDataTexture,de=[];for(let $=0;$<6;$++)!Ge&&!ne?de[$]=x(_.image[$],!0,r.maxCubemapSize):de[$]=ne?_.image[$].image:_.image[$],de[$]=nt(_,de[$]);const Ce=de[0],Ae=s.convert(_.format,_.colorSpace),pe=s.convert(_.type),Oe=M(_.internalFormat,Ae,pe,_.colorSpace),Le=_.isVideoTexture!==!0,et=q.__version===void 0||Y===!0,R=J.dataReady;let le=S(_,Ce);Z(n.TEXTURE_CUBE_MAP,_);let W;if(Ge){Le&&et&&t.texStorage2D(n.TEXTURE_CUBE_MAP,le,Oe,Ce.width,Ce.height);for(let $=0;$<6;$++){W=de[$].mipmaps;for(let ae=0;ae<W.length;ae++){const ce=W[ae];_.format!==Yt?Ae!==null?Le?R&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae,0,0,ce.width,ce.height,Ae,ce.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae,Oe,ce.width,ce.height,0,ce.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Le?R&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae,0,0,ce.width,ce.height,Ae,pe,ce.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae,Oe,ce.width,ce.height,0,Ae,pe,ce.data)}}}else{if(W=_.mipmaps,Le&&et){W.length>0&&le++;const $=Re(de[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,le,Oe,$.width,$.height)}for(let $=0;$<6;$++)if(ne){Le?R&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,de[$].width,de[$].height,Ae,pe,de[$].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Oe,de[$].width,de[$].height,0,Ae,pe,de[$].data);for(let ae=0;ae<W.length;ae++){const ze=W[ae].image[$].image;Le?R&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae+1,0,0,ze.width,ze.height,Ae,pe,ze.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae+1,Oe,ze.width,ze.height,0,Ae,pe,ze.data)}}else{Le?R&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Ae,pe,de[$]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Oe,Ae,pe,de[$]);for(let ae=0;ae<W.length;ae++){const ce=W[ae];Le?R&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae+1,0,0,Ae,pe,ce.image[$]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+$,ae+1,Oe,Ae,pe,ce.image[$])}}}p(_)&&f(n.TEXTURE_CUBE_MAP),q.__version=J.version,_.onUpdate&&_.onUpdate(_)}E.__version=_.version}function te(E,_,O,Y,J,q){const _e=s.convert(O.format,O.colorSpace),se=s.convert(O.type),ue=M(O.internalFormat,_e,se,O.colorSpace);if(!i.get(_).__hasExternalTextures){const ne=Math.max(1,_.width>>q),de=Math.max(1,_.height>>q);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,q,ue,ne,de,_.depth,0,_e,se,null):t.texImage2D(J,q,ue,ne,de,0,_e,se,null)}t.bindFramebuffer(n.FRAMEBUFFER,E),He(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Y,J,i.get(O).__webglTexture,0,Fe(_)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,Y,J,i.get(O).__webglTexture,q),t.bindFramebuffer(n.FRAMEBUFFER,null)}function me(E,_,O){if(n.bindRenderbuffer(n.RENDERBUFFER,E),_.depthBuffer){const Y=_.depthTexture,J=Y&&Y.isDepthTexture?Y.type:null,q=y(_.stencilBuffer,J),_e=_.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,se=Fe(_);He(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,se,q,_.width,_.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,se,q,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,q,_.width,_.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,_e,n.RENDERBUFFER,E)}else{const Y=_.textures;for(let J=0;J<Y.length;J++){const q=Y[J],_e=s.convert(q.format,q.colorSpace),se=s.convert(q.type),ue=M(q.internalFormat,_e,se,q.colorSpace),Ge=Fe(_);O&&He(_)===!1?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ge,ue,_.width,_.height):He(_)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ge,ue,_.width,_.height):n.renderbufferStorage(n.RENDERBUFFER,ue,_.width,_.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function he(E,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(n.FRAMEBUFFER,E),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!i.get(_.depthTexture).__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),X(_.depthTexture,0);const Y=i.get(_.depthTexture).__webglTexture,J=Fe(_);if(_.depthTexture.format===rr)He(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Y,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.TEXTURE_2D,Y,0);else if(_.depthTexture.format===fr)He(_)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Y,0,J):n.framebufferTexture2D(n.FRAMEBUFFER,n.DEPTH_STENCIL_ATTACHMENT,n.TEXTURE_2D,Y,0);else throw new Error("Unknown depthTexture format")}function De(E){const _=i.get(E),O=E.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==E.depthTexture){const Y=E.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),Y){const J=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,Y.removeEventListener("dispose",J)};Y.addEventListener("dispose",J),_.__depthDisposeCallback=J}_.__boundDepthTexture=Y}if(E.depthTexture&&!_.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");he(_.__webglFramebuffer,E)}else if(O){_.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer[Y]),_.__webglDepthbuffer[Y]===void 0)_.__webglDepthbuffer[Y]=n.createRenderbuffer(),me(_.__webglDepthbuffer[Y],E,!1);else{const J=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,q=_.__webglDepthbuffer[Y];n.bindRenderbuffer(n.RENDERBUFFER,q),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,q)}}else if(t.bindFramebuffer(n.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=n.createRenderbuffer(),me(_.__webglDepthbuffer,E,!1);else{const Y=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,J=_.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,J),n.framebufferRenderbuffer(n.FRAMEBUFFER,Y,n.RENDERBUFFER,J)}t.bindFramebuffer(n.FRAMEBUFFER,null)}function Me(E,_,O){const Y=i.get(E);_!==void 0&&te(Y.__webglFramebuffer,E,E.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&De(E)}function ke(E){const _=E.texture,O=i.get(E),Y=i.get(_);E.addEventListener("dispose",A);const J=E.textures,q=E.isWebGLCubeRenderTarget===!0,_e=J.length>1;if(_e||(Y.__webglTexture===void 0&&(Y.__webglTexture=n.createTexture()),Y.__version=_.version,a.memory.textures++),q){O.__webglFramebuffer=[];for(let se=0;se<6;se++)if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer[se]=[];for(let ue=0;ue<_.mipmaps.length;ue++)O.__webglFramebuffer[se][ue]=n.createFramebuffer()}else O.__webglFramebuffer[se]=n.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer=[];for(let se=0;se<_.mipmaps.length;se++)O.__webglFramebuffer[se]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(_e)for(let se=0,ue=J.length;se<ue;se++){const Ge=i.get(J[se]);Ge.__webglTexture===void 0&&(Ge.__webglTexture=n.createTexture(),a.memory.textures++)}if(E.samples>0&&He(E)===!1){O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let se=0;se<J.length;se++){const ue=J[se];O.__webglColorRenderbuffer[se]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[se]);const Ge=s.convert(ue.format,ue.colorSpace),ne=s.convert(ue.type),de=M(ue.internalFormat,Ge,ne,ue.colorSpace,E.isXRRenderTarget===!0),Ce=Fe(E);n.renderbufferStorageMultisample(n.RENDERBUFFER,Ce,de,E.width,E.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+se,n.RENDERBUFFER,O.__webglColorRenderbuffer[se])}n.bindRenderbuffer(n.RENDERBUFFER,null),E.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),me(O.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(q){t.bindTexture(n.TEXTURE_CUBE_MAP,Y.__webglTexture),Z(n.TEXTURE_CUBE_MAP,_);for(let se=0;se<6;se++)if(_.mipmaps&&_.mipmaps.length>0)for(let ue=0;ue<_.mipmaps.length;ue++)te(O.__webglFramebuffer[se][ue],E,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+se,ue);else te(O.__webglFramebuffer[se],E,_,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+se,0);p(_)&&f(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(_e){for(let se=0,ue=J.length;se<ue;se++){const Ge=J[se],ne=i.get(Ge);t.bindTexture(n.TEXTURE_2D,ne.__webglTexture),Z(n.TEXTURE_2D,Ge),te(O.__webglFramebuffer,E,Ge,n.COLOR_ATTACHMENT0+se,n.TEXTURE_2D,0),p(Ge)&&f(n.TEXTURE_2D)}t.unbindTexture()}else{let se=n.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(se=E.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(se,Y.__webglTexture),Z(se,_),_.mipmaps&&_.mipmaps.length>0)for(let ue=0;ue<_.mipmaps.length;ue++)te(O.__webglFramebuffer[ue],E,_,n.COLOR_ATTACHMENT0,se,ue);else te(O.__webglFramebuffer,E,_,n.COLOR_ATTACHMENT0,se,0);p(_)&&f(se),t.unbindTexture()}E.depthBuffer&&De(E)}function Je(E){const _=E.textures;for(let O=0,Y=_.length;O<Y;O++){const J=_[O];if(p(J)){const q=E.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:n.TEXTURE_2D,_e=i.get(J).__webglTexture;t.bindTexture(q,_e),f(q),t.unbindTexture()}}}const Be=[],P=[];function Gt(E){if(E.samples>0){if(He(E)===!1){const _=E.textures,O=E.width,Y=E.height;let J=n.COLOR_BUFFER_BIT;const q=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,_e=i.get(E),se=_.length>1;if(se)for(let ue=0;ue<_.length;ue++)t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ue,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ue,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,_e.__webglMultisampledFramebuffer),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,_e.__webglFramebuffer);for(let ue=0;ue<_.length;ue++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),se){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,_e.__webglColorRenderbuffer[ue]);const Ge=i.get(_[ue]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Ge,0)}n.blitFramebuffer(0,0,O,Y,0,0,O,Y,J,n.NEAREST),l===!0&&(Be.length=0,P.length=0,Be.push(n.COLOR_ATTACHMENT0+ue),E.depthBuffer&&E.resolveDepthBuffer===!1&&(Be.push(q),P.push(q),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,P)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Be))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),se)for(let ue=0;ue<_.length;ue++){t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ue,n.RENDERBUFFER,_e.__webglColorRenderbuffer[ue]);const Ge=i.get(_[ue]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,_e.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ue,n.TEXTURE_2D,Ge,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,_e.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){const _=E.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[_])}}}function Fe(E){return Math.min(r.maxSamples,E.samples)}function He(E){const _=i.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function Te(E){const _=a.render.frame;h.get(E)!==_&&(h.set(E,_),E.update())}function nt(E,_){const O=E.colorSpace,Y=E.format,J=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||O!==si&&O!==Dn&&(qe.getTransfer(O)===rt?(Y!==Yt||J!==xn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),_}function Re(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=w,this.setTexture2D=X,this.setTexture2DArray=z,this.setTexture3D=C,this.setTextureCube=V,this.rebindTextures=Me,this.setupRenderTarget=ke,this.updateRenderTargetMipmap=Je,this.updateMultisampleRenderTarget=Gt,this.setupDepthRenderbuffer=De,this.setupFrameBufferTexture=te,this.useMultisampledRTT=He}function A_(n,e){function t(i,r=Dn){let s;const a=qe.getTransfer(r);if(i===xn)return n.UNSIGNED_BYTE;if(i===ll)return n.UNSIGNED_SHORT_4_4_4_4;if(i===cl)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Yh)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Kh)return n.BYTE;if(i===qh)return n.SHORT;if(i===zr)return n.UNSIGNED_SHORT;if(i===ol)return n.INT;if(i===ii)return n.UNSIGNED_INT;if(i===mn)return n.FLOAT;if(i===$t)return n.HALF_FLOAT;if(i===$h)return n.ALPHA;if(i===Zh)return n.RGB;if(i===Yt)return n.RGBA;if(i===Jh)return n.LUMINANCE;if(i===Qh)return n.LUMINANCE_ALPHA;if(i===rr)return n.DEPTH_COMPONENT;if(i===fr)return n.DEPTH_STENCIL;if(i===Vr)return n.RED;if(i===na)return n.RED_INTEGER;if(i===qr)return n.RG;if(i===hl)return n.RG_INTEGER;if(i===ul)return n.RGBA_INTEGER;if(i===Ns||i===Fs||i===Os||i===ks)if(a===rt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Ns)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Fs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Os)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ks)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Ns)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Fs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Os)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ks)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===So||i===Mo||i===Eo||i===To)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===So)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Mo)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Eo)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===To)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Co||i===Ao||i===Po)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Co||i===Ao)return a===rt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Po)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(i===Ro||i===Do||i===Lo||i===Io||i===Uo||i===No||i===Fo||i===Oo||i===ko||i===Bo||i===zo||i===Vo||i===Ho||i===Go)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Ro)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Do)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Lo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Io)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Uo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===No)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Fo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Oo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ko)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Bo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===zo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Vo)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ho)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Go)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Bs||i===Wo||i===Xo)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Bs)return a===rt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Wo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Xo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===eu||i===jo||i===Ko||i===qo)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Bs)return s.COMPRESSED_RED_RGTC1_EXT;if(i===jo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ko)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===qo)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===pr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}class P_ extends rn{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Un extends Mt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const R_={type:"move"};class Ya{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Un,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Un,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Un,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const x of e.hand.values()){const p=t.getJointPose(x,i),f=this._getHandJoint(c,x);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),m=.02,g=.005;c.inputState.pinching&&d>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(R_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new Un;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const D_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,L_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class I_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,i){if(this.texture===null){const r=new Lt,s=e.properties.get(r);s.__webglTexture=t.texture,(t.depthNear!=i.depthNear||t.depthFar!=i.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new mt({vertexShader:D_,fragmentShader:L_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ut(new _n(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class U_ extends Ai{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,m=null,g=null;const x=new I_,p=t.getContextAttributes();let f=null,M=null;const y=[],S=[],N=new ye;let A=null;const T=new rn;T.layers.enable(1),T.viewport=new at;const F=new rn;F.layers.enable(2),F.viewport=new at;const K=[T,F],v=new P_;v.layers.enable(1),v.layers.enable(2);let w=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let te=y[j];return te===void 0&&(te=new Ya,y[j]=te),te.getTargetRaySpace()},this.getControllerGrip=function(j){let te=y[j];return te===void 0&&(te=new Ya,y[j]=te),te.getGripSpace()},this.getHand=function(j){let te=y[j];return te===void 0&&(te=new Ya,y[j]=te),te.getHandSpace()};function G(j){const te=S.indexOf(j.inputSource);if(te===-1)return;const me=y[te];me!==void 0&&(me.update(j.inputSource,j.frame,c||a),me.dispatchEvent({type:j.type,data:j.inputSource}))}function X(){r.removeEventListener("select",G),r.removeEventListener("selectstart",G),r.removeEventListener("selectend",G),r.removeEventListener("squeeze",G),r.removeEventListener("squeezestart",G),r.removeEventListener("squeezeend",G),r.removeEventListener("end",X),r.removeEventListener("inputsourceschange",z);for(let j=0;j<y.length;j++){const te=S[j];te!==null&&(S[j]=null,y[j].disconnect(te))}w=null,H=null,x.reset(),e.setRenderTarget(f),m=null,d=null,u=null,r=null,M=null,Pe.stop(),i.isPresenting=!1,e.setPixelRatio(A),e.setSize(N.width,N.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){s=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(j){if(r=j,r!==null){if(f=e.getRenderTarget(),r.addEventListener("select",G),r.addEventListener("selectstart",G),r.addEventListener("selectend",G),r.addEventListener("squeeze",G),r.addEventListener("squeezestart",G),r.addEventListener("squeezeend",G),r.addEventListener("end",X),r.addEventListener("inputsourceschange",z),p.xrCompatible!==!0&&await t.makeXRCompatible(),A=e.getPixelRatio(),e.getSize(N),r.renderState.layers===void 0){const te={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(r,t,te),r.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),M=new bn(m.framebufferWidth,m.framebufferHeight,{format:Yt,type:xn,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}else{let te=null,me=null,he=null;p.depth&&(he=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,te=p.stencil?fr:rr,me=p.stencil?pr:ii);const De={colorFormat:t.RGBA8,depthFormat:he,scaleFactor:s};u=new XRWebGLBinding(r,t),d=u.createProjectionLayer(De),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),M=new bn(d.textureWidth,d.textureHeight,{format:Yt,type:xn,depthTexture:new fu(d.textureWidth,d.textureHeight,me,void 0,void 0,void 0,void 0,void 0,void 0,te),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}M.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Pe.setContext(r),Pe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function z(j){for(let te=0;te<j.removed.length;te++){const me=j.removed[te],he=S.indexOf(me);he>=0&&(S[he]=null,y[he].disconnect(me))}for(let te=0;te<j.added.length;te++){const me=j.added[te];let he=S.indexOf(me);if(he===-1){for(let Me=0;Me<y.length;Me++)if(Me>=S.length){S.push(me),he=Me;break}else if(S[Me]===null){S[Me]=me,he=Me;break}if(he===-1)break}const De=y[he];De&&De.connect(me)}}const C=new L,V=new L;function U(j,te,me){C.setFromMatrixPosition(te.matrixWorld),V.setFromMatrixPosition(me.matrixWorld);const he=C.distanceTo(V),De=te.projectionMatrix.elements,Me=me.projectionMatrix.elements,ke=De[14]/(De[10]-1),Je=De[14]/(De[10]+1),Be=(De[9]+1)/De[5],P=(De[9]-1)/De[5],Gt=(De[8]-1)/De[0],Fe=(Me[8]+1)/Me[0],He=ke*Gt,Te=ke*Fe,nt=he/(-Gt+Fe),Re=nt*-Gt;if(te.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Re),j.translateZ(nt),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),De[10]===-1)j.projectionMatrix.copy(te.projectionMatrix),j.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{const E=ke+nt,_=Je+nt,O=He-Re,Y=Te+(he-Re),J=Be*Je/_*E,q=P*Je/_*E;j.projectionMatrix.makePerspective(O,Y,J,q,E,_),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function ee(j,te){te===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(te.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(r===null)return;let te=j.near,me=j.far;x.texture!==null&&(x.depthNear>0&&(te=x.depthNear),x.depthFar>0&&(me=x.depthFar)),v.near=F.near=T.near=te,v.far=F.far=T.far=me,(w!==v.near||H!==v.far)&&(r.updateRenderState({depthNear:v.near,depthFar:v.far}),w=v.near,H=v.far);const he=j.parent,De=v.cameras;ee(v,he);for(let Me=0;Me<De.length;Me++)ee(De[Me],he);De.length===2?U(v,T,F):v.projectionMatrix.copy(T.projectionMatrix),Q(j,v,he)};function Q(j,te,me){me===null?j.matrix.copy(te.matrixWorld):(j.matrix.copy(me.matrixWorld),j.matrix.invert(),j.matrix.multiply(te.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(te.projectionMatrix),j.projectionMatrixInverse.copy(te.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Yo*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(j){l=j,d!==null&&(d.fixedFoveation=j),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=j)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(v)};let Z=null;function ge(j,te){if(h=te.getViewerPose(c||a),g=te,h!==null){const me=h.views;m!==null&&(e.setRenderTargetFramebuffer(M,m.framebuffer),e.setRenderTarget(M));let he=!1;me.length!==v.cameras.length&&(v.cameras.length=0,he=!0);for(let Me=0;Me<me.length;Me++){const ke=me[Me];let Je=null;if(m!==null)Je=m.getViewport(ke);else{const P=u.getViewSubImage(d,ke);Je=P.viewport,Me===0&&(e.setRenderTargetTextures(M,P.colorTexture,d.ignoreDepthValues?void 0:P.depthStencilTexture),e.setRenderTarget(M))}let Be=K[Me];Be===void 0&&(Be=new rn,Be.layers.enable(Me),Be.viewport=new at,K[Me]=Be),Be.matrix.fromArray(ke.transform.matrix),Be.matrix.decompose(Be.position,Be.quaternion,Be.scale),Be.projectionMatrix.fromArray(ke.projectionMatrix),Be.projectionMatrixInverse.copy(Be.projectionMatrix).invert(),Be.viewport.set(Je.x,Je.y,Je.width,Je.height),Me===0&&(v.matrix.copy(Be.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),he===!0&&v.cameras.push(Be)}const De=r.enabledFeatures;if(De&&De.includes("depth-sensing")){const Me=u.getDepthInformation(me[0]);Me&&Me.isValid&&Me.texture&&x.init(e,Me,r.renderState)}}for(let me=0;me<y.length;me++){const he=S[me],De=y[me];he!==null&&De!==void 0&&De.update(he,te,c||a)}Z&&Z(j,te),te.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:te}),g=null}const Pe=new pu;Pe.setAnimationLoop(ge),this.setAnimationLoop=function(j){Z=j},this.dispose=function(){}}}const di=new kn,N_=new $e;function F_(n,e){function t(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function i(p,f){f.color.getRGB(p.fogColor.value,cu(n)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function r(p,f,M,y,S){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(p,f):f.isMeshToonMaterial?(s(p,f),u(p,f)):f.isMeshPhongMaterial?(s(p,f),h(p,f)):f.isMeshStandardMaterial?(s(p,f),d(p,f),f.isMeshPhysicalMaterial&&m(p,f,S)):f.isMeshMatcapMaterial?(s(p,f),g(p,f)):f.isMeshDepthMaterial?s(p,f):f.isMeshDistanceMaterial?(s(p,f),x(p,f)):f.isMeshNormalMaterial?s(p,f):f.isLineBasicMaterial?(a(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?l(p,f,M,y):f.isSpriteMaterial?c(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,t(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===zt&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,t(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===zt&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,t(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,t(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,t(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);const M=e.get(f),y=M.envMap,S=M.envMapRotation;y&&(p.envMap.value=y,di.copy(S),di.x*=-1,di.y*=-1,di.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(di.y*=-1,di.z*=-1),p.envMapRotation.value.setFromMatrix4(N_.makeRotationFromEuler(di)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,t(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,t(f.aoMap,p.aoMapTransform))}function a(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform))}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,M,y){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*M,p.scale.value=y*.5,f.map&&(p.map.value=f.map,t(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,t(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,t(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function u(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function d(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,t(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,t(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,M){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,t(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,t(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,t(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,t(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,t(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===zt&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,t(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,t(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=M.texture,p.transmissionSamplerSize.value.set(M.width,M.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,t(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,t(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,t(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,t(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,t(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function x(p,f){const M=e.get(f).light;p.referencePosition.value.setFromMatrixPosition(M.matrixWorld),p.nearDistance.value=M.shadow.camera.near,p.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function O_(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,y){const S=y.program;i.uniformBlockBinding(M,S)}function c(M,y){let S=r[M.id];S===void 0&&(g(M),S=h(M),r[M.id]=S,M.addEventListener("dispose",p));const N=y.program;i.updateUBOMapping(M,N);const A=e.render.frame;s[M.id]!==A&&(d(M),s[M.id]=A)}function h(M){const y=u();M.__bindingPointIndex=y;const S=n.createBuffer(),N=M.__size,A=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,S),n.bufferData(n.UNIFORM_BUFFER,N,A),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,y,S),S}function u(){for(let M=0;M<o;M++)if(a.indexOf(M)===-1)return a.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){const y=r[M.id],S=M.uniforms,N=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,y);for(let A=0,T=S.length;A<T;A++){const F=Array.isArray(S[A])?S[A]:[S[A]];for(let K=0,v=F.length;K<v;K++){const w=F[K];if(m(w,A,K,N)===!0){const H=w.__offset,G=Array.isArray(w.value)?w.value:[w.value];let X=0;for(let z=0;z<G.length;z++){const C=G[z],V=x(C);typeof C=="number"||typeof C=="boolean"?(w.__data[0]=C,n.bufferSubData(n.UNIFORM_BUFFER,H+X,w.__data)):C.isMatrix3?(w.__data[0]=C.elements[0],w.__data[1]=C.elements[1],w.__data[2]=C.elements[2],w.__data[3]=0,w.__data[4]=C.elements[3],w.__data[5]=C.elements[4],w.__data[6]=C.elements[5],w.__data[7]=0,w.__data[8]=C.elements[6],w.__data[9]=C.elements[7],w.__data[10]=C.elements[8],w.__data[11]=0):(C.toArray(w.__data,X),X+=V.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,H,w.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(M,y,S,N){const A=M.value,T=y+"_"+S;if(N[T]===void 0)return typeof A=="number"||typeof A=="boolean"?N[T]=A:N[T]=A.clone(),!0;{const F=N[T];if(typeof A=="number"||typeof A=="boolean"){if(F!==A)return N[T]=A,!0}else if(F.equals(A)===!1)return F.copy(A),!0}return!1}function g(M){const y=M.uniforms;let S=0;const N=16;for(let T=0,F=y.length;T<F;T++){const K=Array.isArray(y[T])?y[T]:[y[T]];for(let v=0,w=K.length;v<w;v++){const H=K[v],G=Array.isArray(H.value)?H.value:[H.value];for(let X=0,z=G.length;X<z;X++){const C=G[X],V=x(C),U=S%N,ee=U%V.boundary,Q=U+ee;S+=ee,Q!==0&&N-Q<V.storage&&(S+=N-Q),H.__data=new Float32Array(V.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=S,S+=V.storage}}}const A=S%N;return A>0&&(S+=N-A),M.__size=S,M.__cache={},this}function x(M){const y={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(y.boundary=4,y.storage=4):M.isVector2?(y.boundary=8,y.storage=8):M.isVector3||M.isColor?(y.boundary=16,y.storage=12):M.isVector4?(y.boundary=16,y.storage=16):M.isMatrix3?(y.boundary=48,y.storage=48):M.isMatrix4?(y.boundary=64,y.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),y}function p(M){const y=M.target;y.removeEventListener("dispose",p);const S=a.indexOf(y.__bindingPointIndex);a.splice(S,1),n.deleteBuffer(r[y.id]),delete r[y.id],delete s[y.id]}function f(){for(const M in r)n.deleteBuffer(r[M]);a=[],r={},s={}}return{bind:l,update:c,dispose:f}}class k_{constructor(e={}){const{canvas:t=Ep(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e;this.isWebGLRenderer=!0;let d;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=i.getContextAttributes().alpha}else d=a;const m=new Uint32Array(4),g=new Int32Array(4);let x=null,p=null;const f=[],M=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=dn,this.toneMapping=ei,this.toneMappingExposure=1;const y=this;let S=!1,N=0,A=0,T=null,F=-1,K=null;const v=new at,w=new at;let H=null;const G=new we(0);let X=0,z=t.width,C=t.height,V=1,U=null,ee=null;const Q=new at(0,0,z,C),Z=new at(0,0,z,C);let ge=!1;const Pe=new ml;let j=!1,te=!1;const me=new $e,he=new $e,De=new L,Me=new at,ke={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Je=!1;function Be(){return T===null?V:1}let P=i;function Gt(b,D){return t.getContext(b,D)}try{const b={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${al}`),t.addEventListener("webglcontextlost",$,!1),t.addEventListener("webglcontextrestored",ae,!1),t.addEventListener("webglcontextcreationerror",ce,!1),P===null){const D="webgl2";if(P=Gt(D,b),P===null)throw Gt(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw console.error("THREE.WebGLRenderer: "+b.message),b}let Fe,He,Te,nt,Re,E,_,O,Y,J,q,_e,se,ue,Ge,ne,de,Ce,Ae,pe,Oe,Le,et,R;function le(){Fe=new Gv(P),Fe.init(),Le=new A_(P,Fe),He=new Ov(P,Fe,e,Le),Te=new E_(P),He.reverseDepthBuffer&&Te.buffers.depth.setReversed(!0),nt=new jv(P),Re=new h_,E=new C_(P,Fe,Te,Re,He,Le,nt),_=new Bv(y),O=new Hv(y),Y=new Jp(P),et=new Nv(P,Y),J=new Wv(P,Y,nt,et),q=new qv(P,J,Y,nt),Ae=new Kv(P,He,E),ne=new kv(Re),_e=new c_(y,_,O,Fe,He,et,ne),se=new F_(y,Re),ue=new d_,Ge=new __(Fe),Ce=new Uv(y,_,O,Te,q,d,l),de=new S_(y,q,He),R=new O_(P,nt,He,Te),pe=new Fv(P,Fe,nt),Oe=new Xv(P,Fe,nt),nt.programs=_e.programs,y.capabilities=He,y.extensions=Fe,y.properties=Re,y.renderLists=ue,y.shadowMap=de,y.state=Te,y.info=nt}le();const W=new U_(y,P);this.xr=W,this.getContext=function(){return P},this.getContextAttributes=function(){return P.getContextAttributes()},this.forceContextLoss=function(){const b=Fe.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Fe.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(b){b!==void 0&&(V=b,this.setSize(z,C,!1))},this.getSize=function(b){return b.set(z,C)},this.setSize=function(b,D,k=!0){if(W.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=b,C=D,t.width=Math.floor(b*V),t.height=Math.floor(D*V),k===!0&&(t.style.width=b+"px",t.style.height=D+"px"),this.setViewport(0,0,b,D)},this.getDrawingBufferSize=function(b){return b.set(z*V,C*V).floor()},this.setDrawingBufferSize=function(b,D,k){z=b,C=D,V=k,t.width=Math.floor(b*k),t.height=Math.floor(D*k),this.setViewport(0,0,b,D)},this.getCurrentViewport=function(b){return b.copy(v)},this.getViewport=function(b){return b.copy(Q)},this.setViewport=function(b,D,k,B){b.isVector4?Q.set(b.x,b.y,b.z,b.w):Q.set(b,D,k,B),Te.viewport(v.copy(Q).multiplyScalar(V).round())},this.getScissor=function(b){return b.copy(Z)},this.setScissor=function(b,D,k,B){b.isVector4?Z.set(b.x,b.y,b.z,b.w):Z.set(b,D,k,B),Te.scissor(w.copy(Z).multiplyScalar(V).round())},this.getScissorTest=function(){return ge},this.setScissorTest=function(b){Te.setScissorTest(ge=b)},this.setOpaqueSort=function(b){U=b},this.setTransparentSort=function(b){ee=b},this.getClearColor=function(b){return b.copy(Ce.getClearColor())},this.setClearColor=function(){Ce.setClearColor.apply(Ce,arguments)},this.getClearAlpha=function(){return Ce.getClearAlpha()},this.setClearAlpha=function(){Ce.setClearAlpha.apply(Ce,arguments)},this.clear=function(b=!0,D=!0,k=!0){let B=0;if(b){let I=!1;if(T!==null){const ie=T.texture.format;I=ie===ul||ie===hl||ie===na}if(I){const ie=T.texture.type,oe=ie===xn||ie===ii||ie===zr||ie===pr||ie===ll||ie===cl,fe=Ce.getClearColor(),ve=Ce.getClearAlpha(),Se=fe.r,Ee=fe.g,xe=fe.b;oe?(m[0]=Se,m[1]=Ee,m[2]=xe,m[3]=ve,P.clearBufferuiv(P.COLOR,0,m)):(g[0]=Se,g[1]=Ee,g[2]=xe,g[3]=ve,P.clearBufferiv(P.COLOR,0,g))}else B|=P.COLOR_BUFFER_BIT}D&&(B|=P.DEPTH_BUFFER_BIT,P.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),k&&(B|=P.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),P.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",$,!1),t.removeEventListener("webglcontextrestored",ae,!1),t.removeEventListener("webglcontextcreationerror",ce,!1),ue.dispose(),Ge.dispose(),Re.dispose(),_.dispose(),O.dispose(),q.dispose(),et.dispose(),R.dispose(),_e.dispose(),W.dispose(),W.removeEventListener("sessionstart",Yl),W.removeEventListener("sessionend",$l),ai.stop()};function $(b){b.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),S=!0}function ae(){console.log("THREE.WebGLRenderer: Context Restored."),S=!1;const b=nt.autoReset,D=de.enabled,k=de.autoUpdate,B=de.needsUpdate,I=de.type;le(),nt.autoReset=b,de.enabled=D,de.autoUpdate=k,de.needsUpdate=B,de.type=I}function ce(b){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function ze(b){const D=b.target;D.removeEventListener("dispose",ze),pt(D)}function pt(b){Nt(b),Re.remove(b)}function Nt(b){const D=Re.get(b).programs;D!==void 0&&(D.forEach(function(k){_e.releaseProgram(k)}),b.isShaderMaterial&&_e.releaseShaderCache(b))}this.renderBufferDirect=function(b,D,k,B,I,ie){D===null&&(D=ke);const oe=I.isMesh&&I.matrixWorld.determinant()<0,fe=Ud(b,D,k,B,I);Te.setMaterial(B,oe);let ve=k.index,Se=1;if(B.wireframe===!0){if(ve=J.getWireframeAttribute(k),ve===void 0)return;Se=2}const Ee=k.drawRange,xe=k.attributes.position;let Ze=Ee.start*Se,it=(Ee.start+Ee.count)*Se;ie!==null&&(Ze=Math.max(Ze,ie.start*Se),it=Math.min(it,(ie.start+ie.count)*Se)),ve!==null?(Ze=Math.max(Ze,0),it=Math.min(it,ve.count)):xe!=null&&(Ze=Math.max(Ze,0),it=Math.min(it,xe.count));const lt=it-Ze;if(lt<0||lt===1/0)return;et.setup(I,B,fe,k,ve);let Wt,je=pe;if(ve!==null&&(Wt=Y.get(ve),je=Oe,je.setIndex(Wt)),I.isMesh)B.wireframe===!0?(Te.setLineWidth(B.wireframeLinewidth*Be()),je.setMode(P.LINES)):je.setMode(P.TRIANGLES);else if(I.isLine){let be=B.linewidth;be===void 0&&(be=1),Te.setLineWidth(be*Be()),I.isLineSegments?je.setMode(P.LINES):I.isLineLoop?je.setMode(P.LINE_LOOP):je.setMode(P.LINE_STRIP)}else I.isPoints?je.setMode(P.POINTS):I.isSprite&&je.setMode(P.TRIANGLES);if(I.isBatchedMesh)if(I._multiDrawInstances!==null)je.renderMultiDrawInstances(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount,I._multiDrawInstances);else if(Fe.get("WEBGL_multi_draw"))je.renderMultiDraw(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount);else{const be=I._multiDrawStarts,Et=I._multiDrawCounts,Ke=I._multiDrawCount,ln=ve?Y.get(ve).bytesPerElement:1,Ii=Re.get(B).currentProgram.getUniforms();for(let Xt=0;Xt<Ke;Xt++)Ii.setValue(P,"_gl_DrawID",Xt),je.render(be[Xt]/ln,Et[Xt])}else if(I.isInstancedMesh)je.renderInstances(Ze,lt,I.count);else if(k.isInstancedBufferGeometry){const be=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Et=Math.min(k.instanceCount,be);je.renderInstances(Ze,lt,Et)}else je.render(Ze,lt)};function Xe(b,D,k){b.transparent===!0&&b.side===pn&&b.forceSinglePass===!1?(b.side=zt,b.needsUpdate=!0,cs(b,D,k),b.side=ni,b.needsUpdate=!0,cs(b,D,k),b.side=pn):cs(b,D,k)}this.compile=function(b,D,k=null){k===null&&(k=b),p=Ge.get(k),p.init(D),M.push(p),k.traverseVisible(function(I){I.isLight&&I.layers.test(D.layers)&&(p.pushLight(I),I.castShadow&&p.pushShadow(I))}),b!==k&&b.traverseVisible(function(I){I.isLight&&I.layers.test(D.layers)&&(p.pushLight(I),I.castShadow&&p.pushShadow(I))}),p.setupLights();const B=new Set;return b.traverse(function(I){if(!(I.isMesh||I.isPoints||I.isLine||I.isSprite))return;const ie=I.material;if(ie)if(Array.isArray(ie))for(let oe=0;oe<ie.length;oe++){const fe=ie[oe];Xe(fe,k,I),B.add(fe)}else Xe(ie,k,I),B.add(ie)}),M.pop(),p=null,B},this.compileAsync=function(b,D,k=null){const B=this.compile(b,D,k);return new Promise(I=>{function ie(){if(B.forEach(function(oe){Re.get(oe).currentProgram.isReady()&&B.delete(oe)}),B.size===0){I(b);return}setTimeout(ie,10)}Fe.get("KHR_parallel_shader_compile")!==null?ie():setTimeout(ie,10)})};let Ft=null;function Sn(b){Ft&&Ft(b)}function Yl(){ai.stop()}function $l(){ai.start()}const ai=new pu;ai.setAnimationLoop(Sn),typeof self<"u"&&ai.setContext(self),this.setAnimationLoop=function(b){Ft=b,W.setAnimationLoop(b),b===null?ai.stop():ai.start()},W.addEventListener("sessionstart",Yl),W.addEventListener("sessionend",$l),this.render=function(b,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(S===!0)return;if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),W.enabled===!0&&W.isPresenting===!0&&(W.cameraAutoUpdate===!0&&W.updateCamera(D),D=W.getCamera()),b.isScene===!0&&b.onBeforeRender(y,b,D,T),p=Ge.get(b,M.length),p.init(D),M.push(p),he.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),Pe.setFromProjectionMatrix(he),te=this.localClippingEnabled,j=ne.init(this.clippingPlanes,te),x=ue.get(b,f.length),x.init(),f.push(x),W.enabled===!0&&W.isPresenting===!0){const ie=y.xr.getDepthSensingMesh();ie!==null&&va(ie,D,-1/0,y.sortObjects)}va(b,D,0,y.sortObjects),x.finish(),y.sortObjects===!0&&x.sort(U,ee),Je=W.enabled===!1||W.isPresenting===!1||W.hasDepthSensing()===!1,Je&&Ce.addToRenderList(x,b),this.info.render.frame++,j===!0&&ne.beginShadows();const k=p.state.shadowsArray;de.render(k,b,D),j===!0&&ne.endShadows(),this.info.autoReset===!0&&this.info.reset();const B=x.opaque,I=x.transmissive;if(p.setupLights(),D.isArrayCamera){const ie=D.cameras;if(I.length>0)for(let oe=0,fe=ie.length;oe<fe;oe++){const ve=ie[oe];Jl(B,I,b,ve)}Je&&Ce.render(b);for(let oe=0,fe=ie.length;oe<fe;oe++){const ve=ie[oe];Zl(x,b,ve,ve.viewport)}}else I.length>0&&Jl(B,I,b,D),Je&&Ce.render(b),Zl(x,b,D);T!==null&&(E.updateMultisampleRenderTarget(T),E.updateRenderTargetMipmap(T)),b.isScene===!0&&b.onAfterRender(y,b,D),et.resetDefaultState(),F=-1,K=null,M.pop(),M.length>0?(p=M[M.length-1],j===!0&&ne.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,f.pop(),f.length>0?x=f[f.length-1]:x=null};function va(b,D,k,B){if(b.visible===!1)return;if(b.layers.test(D.layers)){if(b.isGroup)k=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(D);else if(b.isLight)p.pushLight(b),b.castShadow&&p.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||Pe.intersectsSprite(b)){B&&Me.setFromMatrixPosition(b.matrixWorld).applyMatrix4(he);const oe=q.update(b),fe=b.material;fe.visible&&x.push(b,oe,fe,k,Me.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||Pe.intersectsObject(b))){const oe=q.update(b),fe=b.material;if(B&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Me.copy(b.boundingSphere.center)):(oe.boundingSphere===null&&oe.computeBoundingSphere(),Me.copy(oe.boundingSphere.center)),Me.applyMatrix4(b.matrixWorld).applyMatrix4(he)),Array.isArray(fe)){const ve=oe.groups;for(let Se=0,Ee=ve.length;Se<Ee;Se++){const xe=ve[Se],Ze=fe[xe.materialIndex];Ze&&Ze.visible&&x.push(b,oe,Ze,k,Me.z,xe)}}else fe.visible&&x.push(b,oe,fe,k,Me.z,null)}}const ie=b.children;for(let oe=0,fe=ie.length;oe<fe;oe++)va(ie[oe],D,k,B)}function Zl(b,D,k,B){const I=b.opaque,ie=b.transmissive,oe=b.transparent;p.setupLightsView(k),j===!0&&ne.setGlobalState(y.clippingPlanes,k),B&&Te.viewport(v.copy(B)),I.length>0&&ls(I,D,k),ie.length>0&&ls(ie,D,k),oe.length>0&&ls(oe,D,k),Te.buffers.depth.setTest(!0),Te.buffers.depth.setMask(!0),Te.buffers.color.setMask(!0),Te.setPolygonOffset(!1)}function Jl(b,D,k,B){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[B.id]===void 0&&(p.state.transmissionRenderTarget[B.id]=new bn(1,1,{generateMipmaps:!0,type:Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float")?$t:xn,minFilter:bi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:qe.workingColorSpace}));const ie=p.state.transmissionRenderTarget[B.id],oe=B.viewport||v;ie.setSize(oe.z,oe.w);const fe=y.getRenderTarget();y.setRenderTarget(ie),y.getClearColor(G),X=y.getClearAlpha(),X<1&&y.setClearColor(16777215,.5),y.clear(),Je&&Ce.render(k);const ve=y.toneMapping;y.toneMapping=ei;const Se=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),p.setupLightsView(B),j===!0&&ne.setGlobalState(y.clippingPlanes,B),ls(b,k,B),E.updateMultisampleRenderTarget(ie),E.updateRenderTargetMipmap(ie),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let Ee=!1;for(let xe=0,Ze=D.length;xe<Ze;xe++){const it=D[xe],lt=it.object,Wt=it.geometry,je=it.material,be=it.group;if(je.side===pn&&lt.layers.test(B.layers)){const Et=je.side;je.side=zt,je.needsUpdate=!0,Ql(lt,k,B,Wt,je,be),je.side=Et,je.needsUpdate=!0,Ee=!0}}Ee===!0&&(E.updateMultisampleRenderTarget(ie),E.updateRenderTargetMipmap(ie))}y.setRenderTarget(fe),y.setClearColor(G,X),Se!==void 0&&(B.viewport=Se),y.toneMapping=ve}function ls(b,D,k){const B=D.isScene===!0?D.overrideMaterial:null;for(let I=0,ie=b.length;I<ie;I++){const oe=b[I],fe=oe.object,ve=oe.geometry,Se=B===null?oe.material:B,Ee=oe.group;fe.layers.test(k.layers)&&Ql(fe,D,k,ve,Se,Ee)}}function Ql(b,D,k,B,I,ie){b.onBeforeRender(y,D,k,B,I,ie),b.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),I.onBeforeRender(y,D,k,B,b,ie),I.transparent===!0&&I.side===pn&&I.forceSinglePass===!1?(I.side=zt,I.needsUpdate=!0,y.renderBufferDirect(k,D,B,I,b,ie),I.side=ni,I.needsUpdate=!0,y.renderBufferDirect(k,D,B,I,b,ie),I.side=pn):y.renderBufferDirect(k,D,B,I,b,ie),b.onAfterRender(y,D,k,B,I,ie)}function cs(b,D,k){D.isScene!==!0&&(D=ke);const B=Re.get(b),I=p.state.lights,ie=p.state.shadowsArray,oe=I.state.version,fe=_e.getParameters(b,I.state,ie,D,k),ve=_e.getProgramCacheKey(fe);let Se=B.programs;B.environment=b.isMeshStandardMaterial?D.environment:null,B.fog=D.fog,B.envMap=(b.isMeshStandardMaterial?O:_).get(b.envMap||B.environment),B.envMapRotation=B.environment!==null&&b.envMap===null?D.environmentRotation:b.envMapRotation,Se===void 0&&(b.addEventListener("dispose",ze),Se=new Map,B.programs=Se);let Ee=Se.get(ve);if(Ee!==void 0){if(B.currentProgram===Ee&&B.lightsStateVersion===oe)return tc(b,fe),Ee}else fe.uniforms=_e.getUniforms(b),b.onBeforeCompile(fe,y),Ee=_e.acquireProgram(fe,ve),Se.set(ve,Ee),B.uniforms=fe.uniforms;const xe=B.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(xe.clippingPlanes=ne.uniform),tc(b,fe),B.needsLights=Fd(b),B.lightsStateVersion=oe,B.needsLights&&(xe.ambientLightColor.value=I.state.ambient,xe.lightProbe.value=I.state.probe,xe.directionalLights.value=I.state.directional,xe.directionalLightShadows.value=I.state.directionalShadow,xe.spotLights.value=I.state.spot,xe.spotLightShadows.value=I.state.spotShadow,xe.rectAreaLights.value=I.state.rectArea,xe.ltc_1.value=I.state.rectAreaLTC1,xe.ltc_2.value=I.state.rectAreaLTC2,xe.pointLights.value=I.state.point,xe.pointLightShadows.value=I.state.pointShadow,xe.hemisphereLights.value=I.state.hemi,xe.directionalShadowMap.value=I.state.directionalShadowMap,xe.directionalShadowMatrix.value=I.state.directionalShadowMatrix,xe.spotShadowMap.value=I.state.spotShadowMap,xe.spotLightMatrix.value=I.state.spotLightMatrix,xe.spotLightMap.value=I.state.spotLightMap,xe.pointShadowMap.value=I.state.pointShadowMap,xe.pointShadowMatrix.value=I.state.pointShadowMatrix),B.currentProgram=Ee,B.uniformsList=null,Ee}function ec(b){if(b.uniformsList===null){const D=b.currentProgram.getUniforms();b.uniformsList=Hs.seqWithValue(D.seq,b.uniforms)}return b.uniformsList}function tc(b,D){const k=Re.get(b);k.outputColorSpace=D.outputColorSpace,k.batching=D.batching,k.batchingColor=D.batchingColor,k.instancing=D.instancing,k.instancingColor=D.instancingColor,k.instancingMorph=D.instancingMorph,k.skinning=D.skinning,k.morphTargets=D.morphTargets,k.morphNormals=D.morphNormals,k.morphColors=D.morphColors,k.morphTargetsCount=D.morphTargetsCount,k.numClippingPlanes=D.numClippingPlanes,k.numIntersection=D.numClipIntersection,k.vertexAlphas=D.vertexAlphas,k.vertexTangents=D.vertexTangents,k.toneMapping=D.toneMapping}function Ud(b,D,k,B,I){D.isScene!==!0&&(D=ke),E.resetTextureUnits();const ie=D.fog,oe=B.isMeshStandardMaterial?D.environment:null,fe=T===null?y.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:si,ve=(B.isMeshStandardMaterial?O:_).get(B.envMap||oe),Se=B.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Ee=!!k.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),xe=!!k.morphAttributes.position,Ze=!!k.morphAttributes.normal,it=!!k.morphAttributes.color;let lt=ei;B.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(lt=y.toneMapping);const Wt=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,je=Wt!==void 0?Wt.length:0,be=Re.get(B),Et=p.state.lights;if(j===!0&&(te===!0||b!==K)){const en=b===K&&B.id===F;ne.setState(B,b,en)}let Ke=!1;B.version===be.__version?(be.needsLights&&be.lightsStateVersion!==Et.state.version||be.outputColorSpace!==fe||I.isBatchedMesh&&be.batching===!1||!I.isBatchedMesh&&be.batching===!0||I.isBatchedMesh&&be.batchingColor===!0&&I.colorTexture===null||I.isBatchedMesh&&be.batchingColor===!1&&I.colorTexture!==null||I.isInstancedMesh&&be.instancing===!1||!I.isInstancedMesh&&be.instancing===!0||I.isSkinnedMesh&&be.skinning===!1||!I.isSkinnedMesh&&be.skinning===!0||I.isInstancedMesh&&be.instancingColor===!0&&I.instanceColor===null||I.isInstancedMesh&&be.instancingColor===!1&&I.instanceColor!==null||I.isInstancedMesh&&be.instancingMorph===!0&&I.morphTexture===null||I.isInstancedMesh&&be.instancingMorph===!1&&I.morphTexture!==null||be.envMap!==ve||B.fog===!0&&be.fog!==ie||be.numClippingPlanes!==void 0&&(be.numClippingPlanes!==ne.numPlanes||be.numIntersection!==ne.numIntersection)||be.vertexAlphas!==Se||be.vertexTangents!==Ee||be.morphTargets!==xe||be.morphNormals!==Ze||be.morphColors!==it||be.toneMapping!==lt||be.morphTargetsCount!==je)&&(Ke=!0):(Ke=!0,be.__version=B.version);let ln=be.currentProgram;Ke===!0&&(ln=cs(B,D,I));let Ii=!1,Xt=!1,ga=!1;const dt=ln.getUniforms(),Hn=be.uniforms;if(Te.useProgram(ln.program)&&(Ii=!0,Xt=!0,ga=!0),B.id!==F&&(F=B.id,Xt=!0),Ii||K!==b){He.reverseDepthBuffer?(me.copy(b.projectionMatrix),Cp(me),Ap(me),dt.setValue(P,"projectionMatrix",me)):dt.setValue(P,"projectionMatrix",b.projectionMatrix),dt.setValue(P,"viewMatrix",b.matrixWorldInverse);const en=dt.map.cameraPosition;en!==void 0&&en.setValue(P,De.setFromMatrixPosition(b.matrixWorld)),He.logarithmicDepthBuffer&&dt.setValue(P,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&dt.setValue(P,"isOrthographic",b.isOrthographicCamera===!0),K!==b&&(K=b,Xt=!0,ga=!0)}if(I.isSkinnedMesh){dt.setOptional(P,I,"bindMatrix"),dt.setOptional(P,I,"bindMatrixInverse");const en=I.skeleton;en&&(en.boneTexture===null&&en.computeBoneTexture(),dt.setValue(P,"boneTexture",en.boneTexture,E))}I.isBatchedMesh&&(dt.setOptional(P,I,"batchingTexture"),dt.setValue(P,"batchingTexture",I._matricesTexture,E),dt.setOptional(P,I,"batchingIdTexture"),dt.setValue(P,"batchingIdTexture",I._indirectTexture,E),dt.setOptional(P,I,"batchingColorTexture"),I._colorsTexture!==null&&dt.setValue(P,"batchingColorTexture",I._colorsTexture,E));const _a=k.morphAttributes;if((_a.position!==void 0||_a.normal!==void 0||_a.color!==void 0)&&Ae.update(I,k,ln),(Xt||be.receiveShadow!==I.receiveShadow)&&(be.receiveShadow=I.receiveShadow,dt.setValue(P,"receiveShadow",I.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(Hn.envMap.value=ve,Hn.flipEnvMap.value=ve.isCubeTexture&&ve.isRenderTargetTexture===!1?-1:1),B.isMeshStandardMaterial&&B.envMap===null&&D.environment!==null&&(Hn.envMapIntensity.value=D.environmentIntensity),Xt&&(dt.setValue(P,"toneMappingExposure",y.toneMappingExposure),be.needsLights&&Nd(Hn,ga),ie&&B.fog===!0&&se.refreshFogUniforms(Hn,ie),se.refreshMaterialUniforms(Hn,B,V,C,p.state.transmissionRenderTarget[b.id]),Hs.upload(P,ec(be),Hn,E)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Hs.upload(P,ec(be),Hn,E),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&dt.setValue(P,"center",I.center),dt.setValue(P,"modelViewMatrix",I.modelViewMatrix),dt.setValue(P,"normalMatrix",I.normalMatrix),dt.setValue(P,"modelMatrix",I.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const en=B.uniformsGroups;for(let xa=0,Od=en.length;xa<Od;xa++){const nc=en[xa];R.update(nc,ln),R.bind(nc,ln)}}return ln}function Nd(b,D){b.ambientLightColor.needsUpdate=D,b.lightProbe.needsUpdate=D,b.directionalLights.needsUpdate=D,b.directionalLightShadows.needsUpdate=D,b.pointLights.needsUpdate=D,b.pointLightShadows.needsUpdate=D,b.spotLights.needsUpdate=D,b.spotLightShadows.needsUpdate=D,b.rectAreaLights.needsUpdate=D,b.hemisphereLights.needsUpdate=D}function Fd(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return N},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(b,D,k){Re.get(b.texture).__webglTexture=D,Re.get(b.depthTexture).__webglTexture=k;const B=Re.get(b);B.__hasExternalTextures=!0,B.__autoAllocateDepthBuffer=k===void 0,B.__autoAllocateDepthBuffer||Fe.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),B.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(b,D){const k=Re.get(b);k.__webglFramebuffer=D,k.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(b,D=0,k=0){T=b,N=D,A=k;let B=!0,I=null,ie=!1,oe=!1;if(b){const ve=Re.get(b);if(ve.__useDefaultFramebuffer!==void 0)Te.bindFramebuffer(P.FRAMEBUFFER,null),B=!1;else if(ve.__webglFramebuffer===void 0)E.setupRenderTarget(b);else if(ve.__hasExternalTextures)E.rebindTextures(b,Re.get(b.texture).__webglTexture,Re.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const xe=b.depthTexture;if(ve.__boundDepthTexture!==xe){if(xe!==null&&Re.has(xe)&&(b.width!==xe.image.width||b.height!==xe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(b)}}const Se=b.texture;(Se.isData3DTexture||Se.isDataArrayTexture||Se.isCompressedArrayTexture)&&(oe=!0);const Ee=Re.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Ee[D])?I=Ee[D][k]:I=Ee[D],ie=!0):b.samples>0&&E.useMultisampledRTT(b)===!1?I=Re.get(b).__webglMultisampledFramebuffer:Array.isArray(Ee)?I=Ee[k]:I=Ee,v.copy(b.viewport),w.copy(b.scissor),H=b.scissorTest}else v.copy(Q).multiplyScalar(V).floor(),w.copy(Z).multiplyScalar(V).floor(),H=ge;if(Te.bindFramebuffer(P.FRAMEBUFFER,I)&&B&&Te.drawBuffers(b,I),Te.viewport(v),Te.scissor(w),Te.setScissorTest(H),ie){const ve=Re.get(b.texture);P.framebufferTexture2D(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,P.TEXTURE_CUBE_MAP_POSITIVE_X+D,ve.__webglTexture,k)}else if(oe){const ve=Re.get(b.texture),Se=D||0;P.framebufferTextureLayer(P.FRAMEBUFFER,P.COLOR_ATTACHMENT0,ve.__webglTexture,k||0,Se)}F=-1},this.readRenderTargetPixels=function(b,D,k,B,I,ie,oe){if(!(b&&b.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let fe=Re.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&oe!==void 0&&(fe=fe[oe]),fe){Te.bindFramebuffer(P.FRAMEBUFFER,fe);try{const ve=b.texture,Se=ve.format,Ee=ve.type;if(!He.textureFormatReadable(Se)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!He.textureTypeReadable(Ee)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=b.width-B&&k>=0&&k<=b.height-I&&P.readPixels(D,k,B,I,Le.convert(Se),Le.convert(Ee),ie)}finally{const ve=T!==null?Re.get(T).__webglFramebuffer:null;Te.bindFramebuffer(P.FRAMEBUFFER,ve)}}},this.readRenderTargetPixelsAsync=async function(b,D,k,B,I,ie,oe){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let fe=Re.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&oe!==void 0&&(fe=fe[oe]),fe){const ve=b.texture,Se=ve.format,Ee=ve.type;if(!He.textureFormatReadable(Se))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!He.textureTypeReadable(Ee))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(D>=0&&D<=b.width-B&&k>=0&&k<=b.height-I){Te.bindFramebuffer(P.FRAMEBUFFER,fe);const xe=P.createBuffer();P.bindBuffer(P.PIXEL_PACK_BUFFER,xe),P.bufferData(P.PIXEL_PACK_BUFFER,ie.byteLength,P.STREAM_READ),P.readPixels(D,k,B,I,Le.convert(Se),Le.convert(Ee),0);const Ze=T!==null?Re.get(T).__webglFramebuffer:null;Te.bindFramebuffer(P.FRAMEBUFFER,Ze);const it=P.fenceSync(P.SYNC_GPU_COMMANDS_COMPLETE,0);return P.flush(),await Tp(P,it,4),P.bindBuffer(P.PIXEL_PACK_BUFFER,xe),P.getBufferSubData(P.PIXEL_PACK_BUFFER,0,ie),P.deleteBuffer(xe),P.deleteSync(it),ie}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(b,D=null,k=0){b.isTexture!==!0&&(Vs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),D=arguments[0]||null,b=arguments[1]);const B=Math.pow(2,-k),I=Math.floor(b.image.width*B),ie=Math.floor(b.image.height*B),oe=D!==null?D.x:0,fe=D!==null?D.y:0;E.setTexture2D(b,0),P.copyTexSubImage2D(P.TEXTURE_2D,k,0,0,oe,fe,I,ie),Te.unbindTexture()},this.copyTextureToTexture=function(b,D,k=null,B=null,I=0){b.isTexture!==!0&&(Vs("WebGLRenderer: copyTextureToTexture function signature has changed."),B=arguments[0]||null,b=arguments[1],D=arguments[2],I=arguments[3]||0,k=null);let ie,oe,fe,ve,Se,Ee;k!==null?(ie=k.max.x-k.min.x,oe=k.max.y-k.min.y,fe=k.min.x,ve=k.min.y):(ie=b.image.width,oe=b.image.height,fe=0,ve=0),B!==null?(Se=B.x,Ee=B.y):(Se=0,Ee=0);const xe=Le.convert(D.format),Ze=Le.convert(D.type);E.setTexture2D(D,0),P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,D.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,D.unpackAlignment);const it=P.getParameter(P.UNPACK_ROW_LENGTH),lt=P.getParameter(P.UNPACK_IMAGE_HEIGHT),Wt=P.getParameter(P.UNPACK_SKIP_PIXELS),je=P.getParameter(P.UNPACK_SKIP_ROWS),be=P.getParameter(P.UNPACK_SKIP_IMAGES),Et=b.isCompressedTexture?b.mipmaps[I]:b.image;P.pixelStorei(P.UNPACK_ROW_LENGTH,Et.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,Et.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,fe),P.pixelStorei(P.UNPACK_SKIP_ROWS,ve),b.isDataTexture?P.texSubImage2D(P.TEXTURE_2D,I,Se,Ee,ie,oe,xe,Ze,Et.data):b.isCompressedTexture?P.compressedTexSubImage2D(P.TEXTURE_2D,I,Se,Ee,Et.width,Et.height,xe,Et.data):P.texSubImage2D(P.TEXTURE_2D,I,Se,Ee,ie,oe,xe,Ze,Et),P.pixelStorei(P.UNPACK_ROW_LENGTH,it),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,lt),P.pixelStorei(P.UNPACK_SKIP_PIXELS,Wt),P.pixelStorei(P.UNPACK_SKIP_ROWS,je),P.pixelStorei(P.UNPACK_SKIP_IMAGES,be),I===0&&D.generateMipmaps&&P.generateMipmap(P.TEXTURE_2D),Te.unbindTexture()},this.copyTextureToTexture3D=function(b,D,k=null,B=null,I=0){b.isTexture!==!0&&(Vs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),k=arguments[0]||null,B=arguments[1]||null,b=arguments[2],D=arguments[3],I=arguments[4]||0);let ie,oe,fe,ve,Se,Ee,xe,Ze,it;const lt=b.isCompressedTexture?b.mipmaps[I]:b.image;k!==null?(ie=k.max.x-k.min.x,oe=k.max.y-k.min.y,fe=k.max.z-k.min.z,ve=k.min.x,Se=k.min.y,Ee=k.min.z):(ie=lt.width,oe=lt.height,fe=lt.depth,ve=0,Se=0,Ee=0),B!==null?(xe=B.x,Ze=B.y,it=B.z):(xe=0,Ze=0,it=0);const Wt=Le.convert(D.format),je=Le.convert(D.type);let be;if(D.isData3DTexture)E.setTexture3D(D,0),be=P.TEXTURE_3D;else if(D.isDataArrayTexture||D.isCompressedArrayTexture)E.setTexture2DArray(D,0),be=P.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}P.pixelStorei(P.UNPACK_FLIP_Y_WEBGL,D.flipY),P.pixelStorei(P.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),P.pixelStorei(P.UNPACK_ALIGNMENT,D.unpackAlignment);const Et=P.getParameter(P.UNPACK_ROW_LENGTH),Ke=P.getParameter(P.UNPACK_IMAGE_HEIGHT),ln=P.getParameter(P.UNPACK_SKIP_PIXELS),Ii=P.getParameter(P.UNPACK_SKIP_ROWS),Xt=P.getParameter(P.UNPACK_SKIP_IMAGES);P.pixelStorei(P.UNPACK_ROW_LENGTH,lt.width),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,lt.height),P.pixelStorei(P.UNPACK_SKIP_PIXELS,ve),P.pixelStorei(P.UNPACK_SKIP_ROWS,Se),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Ee),b.isDataTexture||b.isData3DTexture?P.texSubImage3D(be,I,xe,Ze,it,ie,oe,fe,Wt,je,lt.data):D.isCompressedArrayTexture?P.compressedTexSubImage3D(be,I,xe,Ze,it,ie,oe,fe,Wt,lt.data):P.texSubImage3D(be,I,xe,Ze,it,ie,oe,fe,Wt,je,lt),P.pixelStorei(P.UNPACK_ROW_LENGTH,Et),P.pixelStorei(P.UNPACK_IMAGE_HEIGHT,Ke),P.pixelStorei(P.UNPACK_SKIP_PIXELS,ln),P.pixelStorei(P.UNPACK_SKIP_ROWS,Ii),P.pixelStorei(P.UNPACK_SKIP_IMAGES,Xt),I===0&&D.generateMipmaps&&P.generateMipmap(be),Te.unbindTexture()},this.initRenderTarget=function(b){Re.get(b).__webglFramebuffer===void 0&&E.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?E.setTextureCube(b,0):b.isData3DTexture?E.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?E.setTexture2DArray(b,0):E.setTexture2D(b,0),Te.unbindTexture()},this.resetState=function(){N=0,A=0,T=null,Te.reset(),et.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return In}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=e===dl?"display-p3":"srgb",t.unpackColorSpace=qe.workingColorSpace===ia?"display-p3":"srgb"}}class xu extends Mt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new kn,this.environmentIntensity=1,this.environmentRotation=new kn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Ln extends Lt{constructor(e=null,t=1,i=1,r,s,a,o,l,c=ct,h=ct,u,d){super(null,a,o,l,c,h,r,s,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ct extends St{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const qi=new $e,Yc=new $e,Ds=[],$c=new Pi,B_=new $e,Pr=new ut,Rr=new gr;class bu extends ut{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ct(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,B_)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Pi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,qi),$c.copy(e.boundingBox).applyMatrix4(qi),this.boundingBox.union($c)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new gr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,qi),Rr.copy(e.boundingSphere).applyMatrix4(qi),this.boundingSphere.union(Rr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=r[a+o]}raycast(e,t){const i=this.matrixWorld,r=this.count;if(Pr.geometry=this.geometry,Pr.material=this.material,Pr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Rr.copy(this.boundingSphere),Rr.applyMatrix4(i),e.ray.intersectsSphere(Rr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,qi),Yc.multiplyMatrices(i,qi),Pr.matrixWorld=Yc,Pr.raycast(e,Ds);for(let a=0,o=Ds.length;a<o;a++){const l=Ds[a];l.instanceId=s,l.object=this,t.push(l)}Ds.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Ct(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new Ln(new Float32Array(r*this.count),r,this.count,Vr,mn));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<i.length;c++)a+=i[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;s[l]=o,s.set(i,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class gl extends Zt{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};const s=[],a=[];o(r),c(i),h(),this.setAttribute("position",new on(s,3)),this.setAttribute("normal",new on(s.slice(),3)),this.setAttribute("uv",new on(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(M){const y=new L,S=new L,N=new L;for(let A=0;A<t.length;A+=3)m(t[A+0],y),m(t[A+1],S),m(t[A+2],N),l(y,S,N,M)}function l(M,y,S,N){const A=N+1,T=[];for(let F=0;F<=A;F++){T[F]=[];const K=M.clone().lerp(S,F/A),v=y.clone().lerp(S,F/A),w=A-F;for(let H=0;H<=w;H++)H===0&&F===A?T[F][H]=K:T[F][H]=K.clone().lerp(v,H/w)}for(let F=0;F<A;F++)for(let K=0;K<2*(A-F)-1;K++){const v=Math.floor(K/2);K%2===0?(d(T[F][v+1]),d(T[F+1][v]),d(T[F][v])):(d(T[F][v+1]),d(T[F+1][v+1]),d(T[F+1][v]))}}function c(M){const y=new L;for(let S=0;S<s.length;S+=3)y.x=s[S+0],y.y=s[S+1],y.z=s[S+2],y.normalize().multiplyScalar(M),s[S+0]=y.x,s[S+1]=y.y,s[S+2]=y.z}function h(){const M=new L;for(let y=0;y<s.length;y+=3){M.x=s[y+0],M.y=s[y+1],M.z=s[y+2];const S=p(M)/2/Math.PI+.5,N=f(M)/Math.PI+.5;a.push(S,1-N)}g(),u()}function u(){for(let M=0;M<a.length;M+=6){const y=a[M+0],S=a[M+2],N=a[M+4],A=Math.max(y,S,N),T=Math.min(y,S,N);A>.9&&T<.1&&(y<.2&&(a[M+0]+=1),S<.2&&(a[M+2]+=1),N<.2&&(a[M+4]+=1))}}function d(M){s.push(M.x,M.y,M.z)}function m(M,y){const S=M*3;y.x=e[S+0],y.y=e[S+1],y.z=e[S+2]}function g(){const M=new L,y=new L,S=new L,N=new L,A=new ye,T=new ye,F=new ye;for(let K=0,v=0;K<s.length;K+=9,v+=6){M.set(s[K+0],s[K+1],s[K+2]),y.set(s[K+3],s[K+4],s[K+5]),S.set(s[K+6],s[K+7],s[K+8]),A.set(a[v+0],a[v+1]),T.set(a[v+2],a[v+3]),F.set(a[v+4],a[v+5]),N.copy(M).add(y).add(S).divideScalar(3);const w=p(N);x(A,v+0,M,w),x(T,v+2,y,w),x(F,v+4,S,w)}}function x(M,y,S,N){N<0&&M.x===1&&(a[y]=M.x-1),S.x===0&&S.z===0&&(a[y]=N/2/Math.PI+.5)}function p(M){return Math.atan2(M.z,-M.x)}function f(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new gl(e.vertices,e.indices,e.radius,e.details)}}class oa extends gl{constructor(e=1,t=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new oa(e.radius,e.detail)}}class Zr extends mt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class yu extends Mt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new we(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}const $a=new $e,Zc=new L,Jc=new L;class z_{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ye(512,512),this.map=null,this.mapPass=null,this.matrix=new $e,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ml,this._frameExtents=new ye(1,1),this._viewportCount=1,this._viewports=[new at(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;Zc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Zc),Jc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Jc),t.updateMatrixWorld(),$a.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix($a),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply($a)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class V_ extends z_{constructor(){super(new sa(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class H_ extends yu{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Mt.DEFAULT_UP),this.updateMatrix(),this.target=new Mt,this.shadow=new V_}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class G_ extends yu{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class wu extends Zt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}class W_{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Qc(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Qc();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Qc(){return performance.now()}const eh=new $e;class X_{constructor(e,t,i=0,r=1/0){this.ray=new pl(e,t),this.near=i,this.far=r,this.camera=null,this.layers=new fl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return eh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(eh),this}intersectObject(e,t=!0,i=[]){return Zo(e,this,i,t),i.sort(th),i}intersectObjects(e,t=!0,i=[]){for(let r=0,s=e.length;r<s;r++)Zo(e[r],this,i,t);return i.sort(th),i}}function th(n,e){return n.distance-e.distance}function Zo(n,e,t,i){let r=!0;if(n.layers.test(e.layers)&&n.raycast(e,t)===!1&&(r=!1),r===!0&&i===!0){const s=n.children;for(let a=0,o=s.length;a<o;a++)Zo(s[a],e,t,!0)}}class nh{constructor(e=1,t=0,i=0){return this.radius=e,this.phi=t,this.theta=i,this}set(e,t,i){return this.radius=e,this.phi=t,this.theta=i,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,i){return this.radius=Math.sqrt(e*e+t*t+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,i),this.phi=Math.acos(Dt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class j_ extends Ai{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:al}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=al);class K_{constructor(e,t){this.host=e,this.sceneGraph=t,this.canvas=document.createElement("canvas"),e.appendChild(this.canvas),this.renderer=new k_({canvas:this.canvas,antialias:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.outputColorSpace=dn,this.renderer.toneMapping=Xh,this.renderer.toneMappingExposure=1,this.sceneGraph.attachRenderer(this.renderer),this.handleResize()}canvas;renderer;resizeObserver=null;tick(e,t){this.sceneGraph.update(e,t),this.sceneGraph.render(e)}dispose(){this.resizeObserver?.disconnect(),this.resizeObserver=null,this.renderer.dispose(),this.canvas.remove()}handleResize(){const e=()=>{const t=this.host.clientWidth||window.innerWidth,i=this.host.clientHeight||window.innerHeight;this.renderer.setSize(t,i,!1),this.sceneGraph.resize(t,i)};e(),this.resizeObserver=new ResizeObserver(e),this.resizeObserver.observe(this.host)}}const ih={type:"change"},_l={type:"start"},Su={type:"end"},Ls=new pl,rh=new Jn,q_=Math.cos(70*Mp.DEG2RAD),gt=new L,kt=2*Math.PI,Qe={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Za=1e-6;class Y_ extends j_{constructor(e,t=null){super(e,t),this.state=Qe.NONE,this.enabled=!0,this.target=new L,this.cursor=new L,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ir.ROTATE,MIDDLE:ir.DOLLY,RIGHT:ir.PAN},this.touches={ONE:Qi.ROTATE,TWO:Qi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new L,this._lastQuaternion=new Si,this._lastTargetPosition=new L,this._quat=new Si().setFromUnitVectors(e.up,new L(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new nh,this._sphericalDelta=new nh,this._scale=1,this._panOffset=new L,this._rotateStart=new ye,this._rotateEnd=new ye,this._rotateDelta=new ye,this._panStart=new ye,this._panEnd=new ye,this._panDelta=new ye,this._dollyStart=new ye,this._dollyEnd=new ye,this._dollyDelta=new ye,this._dollyDirection=new L,this._mouse=new ye,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Z_.bind(this),this._onPointerDown=$_.bind(this),this._onPointerUp=J_.bind(this),this._onContextMenu=s0.bind(this),this._onMouseWheel=t0.bind(this),this._onKeyDown=n0.bind(this),this._onTouchStart=i0.bind(this),this._onTouchMove=r0.bind(this),this._onMouseDown=Q_.bind(this),this._onMouseMove=e0.bind(this),this._interceptControlDown=a0.bind(this),this._interceptControlUp=o0.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(ih),this.update(),this.state=Qe.NONE}update(e=null){const t=this.object.position;gt.copy(t).sub(this.target),gt.applyQuaternion(this._quat),this._spherical.setFromVector3(gt),this.autoRotate&&this.state===Qe.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(i)&&isFinite(r)&&(i<-Math.PI?i+=kt:i>Math.PI&&(i-=kt),r<-Math.PI?r+=kt:r>Math.PI&&(r-=kt),i<=r?this._spherical.theta=Math.max(i,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+r)/2?Math.max(i,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=a!=this._spherical.radius}if(gt.setFromSpherical(this._spherical),gt.applyQuaternion(this._quatInverse),t.copy(this.target).add(gt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=gt.length();a=this._clampDistance(o*this._scale);const l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){const o=new L(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;const c=new L(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=gt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Ls.origin.copy(this.object.position),Ls.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ls.direction))<q_?this.object.lookAt(this.target):(rh.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ls.intersectPlane(rh,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Za||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Za||this._lastTargetPosition.distanceToSquared(this.target)>Za?(this.dispatchEvent(ih),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?kt/60*this.autoRotateSpeed*e:kt/60/60*this.autoRotateSpeed}_getZoomScale(e){const t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){gt.setFromMatrixColumn(t,0),gt.multiplyScalar(-e),this._panOffset.add(gt)}_panUp(e,t){this.screenSpacePanning===!0?gt.setFromMatrixColumn(t,1):(gt.setFromMatrixColumn(t,0),gt.crossVectors(this.object.up,gt)),gt.multiplyScalar(e),this._panOffset.add(gt)}_pan(e,t){const i=this.domElement;if(this.object.isPerspectiveCamera){const r=this.object.position;gt.copy(r).sub(this.target);let s=gt.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*s/i.clientHeight,this.object.matrix),this._panUp(2*t*s/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const i=this.domElement.getBoundingClientRect(),r=e-i.left,s=t-i.top,a=i.width,o=i.height;this._mouse.x=r/a*2-1,this._mouse.y=-(s/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(kt*this._rotateDelta.x/t.clientHeight),this._rotateUp(kt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(-kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(-kt*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(i,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(i,r)}}_handleTouchStartDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,s=Math.sqrt(i*i+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{const i=this._getSecondPointerPosition(e),r=.5*(e.pageX+i.x),s=.5*(e.pageY+i.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const t=this.domElement;this._rotateLeft(kt*this._rotateDelta.x/t.clientHeight),this._rotateUp(kt*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{const t=this._getSecondPointerPosition(e),i=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(i,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){const t=this._getSecondPointerPosition(e),i=e.pageX-t.x,r=e.pageY-t.y,s=Math.sqrt(i*i+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new ye,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){const t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){const t=e.deltaMode,i={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}}function $_(n){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(n.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(n)&&(this._addPointer(n),n.pointerType==="touch"?this._onTouchStart(n):this._onMouseDown(n)))}function Z_(n){this.enabled!==!1&&(n.pointerType==="touch"?this._onTouchMove(n):this._onMouseMove(n))}function J_(n){switch(this._removePointer(n),this._pointers.length){case 0:this.domElement.releasePointerCapture(n.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Su),this.state=Qe.NONE;break;case 1:const e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function Q_(n){let e;switch(n.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case ir.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(n),this.state=Qe.DOLLY;break;case ir.ROTATE:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Qe.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Qe.ROTATE}break;case ir.PAN:if(n.ctrlKey||n.metaKey||n.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(n),this.state=Qe.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(n),this.state=Qe.PAN}break;default:this.state=Qe.NONE}this.state!==Qe.NONE&&this.dispatchEvent(_l)}function e0(n){switch(this.state){case Qe.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(n);break;case Qe.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(n);break;case Qe.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(n);break}}function t0(n){this.enabled===!1||this.enableZoom===!1||this.state!==Qe.NONE||(n.preventDefault(),this.dispatchEvent(_l),this._handleMouseWheel(this._customWheelEvent(n)),this.dispatchEvent(Su))}function n0(n){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(n)}function i0(n){switch(this._trackPointer(n),this._pointers.length){case 1:switch(this.touches.ONE){case Qi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(n),this.state=Qe.TOUCH_ROTATE;break;case Qi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(n),this.state=Qe.TOUCH_PAN;break;default:this.state=Qe.NONE}break;case 2:switch(this.touches.TWO){case Qi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(n),this.state=Qe.TOUCH_DOLLY_PAN;break;case Qi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(n),this.state=Qe.TOUCH_DOLLY_ROTATE;break;default:this.state=Qe.NONE}break;default:this.state=Qe.NONE}this.state!==Qe.NONE&&this.dispatchEvent(_l)}function r0(n){switch(this._trackPointer(n),this.state){case Qe.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(n),this.update();break;case Qe.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(n),this.update();break;case Qe.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(n),this.update();break;case Qe.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(n),this.update();break;default:this.state=Qe.NONE}}function s0(n){this.enabled!==!1&&n.preventDefault()}function a0(n){n.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function o0(n){n.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const Mi=`// HEALPix \`zphiToPix\` — GLSL port of web/src/world/healpix.ts.
//
// Used by the globe fragment shader to map a unit-sphere fragment position
// (z = sin(lat), phi = lon) to the HEALPix cell index that addresses
// \`uIdRaster\` and \`uAttrDynamic\`.
//
// Parity with the TS canonical lookup is asserted by
// web/src/world/__tests__/healpix-glsl-parity.test.ts via a TS shim that
// mirrors GLSL int semantics (truncating divide). When editing this file,
// keep healpix-glsl-shim.ts line-for-line in sync.
//
// Bit operations require GLSL3 (\`#version 300 es\`). Three.js sets that via
// \`glslVersion: THREE.GLSL3\`. nside is bounded by the bake at <= 4096, so
// 12*nside^2 fits in int32.

const float HEALPIX_TWO_PI = 6.28318530717958647693;
const float HEALPIX_HALF_PI = 1.57079632679489661923;
const float HEALPIX_TWO_THIRDS = 0.6666666666666667;

int healpixSpreadBits(int n) {
  int x = n & 0xffff;
  x = (x | (x << 8)) & 0x00ff00ff;
  x = (x | (x << 4)) & 0x0f0f0f0f;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;
  return x;
}

int healpixXyToMorton(int ix, int iy) {
  return healpixSpreadBits(ix) | (healpixSpreadBits(iy) << 1);
}

// Floor division for ints (mirrors JS Math.floor(a/b) for negative numerators).
int healpixFloorDiv(int a, int b) {
  return int(floor(float(a) / float(b)));
}

int healpixAngToPixRing(int nside, float z, float tt) {
  float za = abs(z);
  int nl4 = 4 * nside;
  float fns = float(nside);

  if (za <= HEALPIX_TWO_THIRDS) {
    float temp1 = fns * (0.5 + tt);
    float temp2 = fns * 0.75 * z;
    int jp = int(floor(temp1 - temp2));
    int jm = int(floor(temp1 + temp2));
    if (z == 0.0 && jp == jm) jp -= 1;
    int ir = nside + 1 + jp - jm;
    int kshift = 1 - (ir & 1);
    int ip = healpixFloorDiv(jp + jm - nside + kshift + 1, 2);
    ip = ((ip % nl4) + nl4) % nl4;
    int ncap = 2 * nside * (nside - 1);
    return ncap + (ir - 1) * nl4 + ip;
  }

  float tp = tt - floor(tt);
  float tmp = fns * sqrt(3.0 * (1.0 - za));
  int jp = int(floor(tp * tmp));
  int jm = int(floor((1.0 - tp) * tmp));
  int ir = jp + jm + 1;
  int ip = int(mod(tt * float(ir), 4.0 * float(ir)));
  if (ip < 0) ip += 4 * ir;
  if (z > 0.0) {
    return 2 * ir * (ir - 1) + ip;
  }
  return 12 * nside * nside - 2 * ir * (ir + 1) + ip;
}

int healpixAngToPixNested(int nside, float z, float tt) {
  float za = abs(z);
  int face;
  int ix;
  int iy;
  float fns = float(nside);

  if (za <= HEALPIX_TWO_THIRDS) {
    float temp1 = fns * (0.5 + tt);
    float temp2 = fns * 0.75 * z;
    int jp = int(floor(temp1 - temp2));
    int jm = int(floor(temp1 + temp2));
    if (z == 0.0 && jp == jm) jp -= 1;
    int ifp = healpixFloorDiv(jp, nside);
    int ifm = healpixFloorDiv(jm, nside);
    if (ifp == ifm) face = (ifp & 3) | 4;
    else if (ifp < ifm) face = ifp & 3;
    else face = (ifm & 3) + 8;
    ix = ((jm % nside) + nside) % nside;
    iy = nside - 1 - (((jp % nside) + nside) % nside);
  } else {
    int ntt = min(3, int(floor(tt)));
    float tp = tt - float(ntt);
    float tmp = fns * sqrt(3.0 * (1.0 - za));
    int jp = int(floor(tp * tmp));
    int jm = int(floor((1.0 - tp) * tmp));
    int jpC = min(nside - 1, jp);
    int jmC = min(nside - 1, jm);
    if (z >= 0.0) {
      face = ntt;
      ix = nside - jmC - 1;
      iy = nside - jpC - 1;
    } else {
      face = ntt + 8;
      ix = jpC;
      iy = jmC;
    }
  }
  return face * nside * nside + healpixXyToMorton(ix, iy);
}

// ordering: 0 = ring, 1 = nested.
int healpixZPhiToPix(int nside, int ordering, float z, float phi) {
  float phiNorm = mod(mod(phi, HEALPIX_TWO_PI) + HEALPIX_TWO_PI, HEALPIX_TWO_PI);
  float tt = mod(phiNorm / HEALPIX_HALF_PI, 4.0);
  if (ordering == 0) return healpixAngToPixRing(nside, z, tt);
  return healpixAngToPixNested(nside, z, tt);
}

// Decompose a flat HEALPix pixel index into (col, row) for sampling a 2D
// texture of width = 4*nside, height = 3*nside. Mirrors IdRaster.toDataTexture.
ivec2 healpixIpixToTexel(int ipix, int width) {
  return ivec2(ipix % width, ipix / width);
}
`,l0=`// Land vertex shader — displaces dry-land vertices outward by their
// continuous-elevation value from the R16F \`uElevationMeters\` texture.
//
// Two refinements vs the naive single-cell read:
//   1. Smoothing — 9-tap blur (centre + 8 sphere-neighbours arranged in
//      a circle) at ~3 HEALPix cells radius. Kills cell-to-cell elevation
//      jumps that show up as pointy triangles at high mesh density.
//   2. Coast fade — count how many of the 8 neighbours are ocean
//      (bodyId == 0). The more ocean nearby, the harder the displacement
//      tapers toward 0, so coastal land meets the flat water shell flush
//      instead of leaving a vertical gap.
//
// \`vSphereDir\` carries the pre-displacement direction so the fragment
// shader's HEALPix lookups stay anchored to the original cell, not the
// displaced position.

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

uniform sampler2D uElevationMeters;
uniform highp usampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;     // unit-sphere displacement per metre

out vec3 vWorldPos;
out vec3 vSphereDir;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vec3 dir = normalize(position);
  vSphereDir = dir;

  // Tangent basis. \`up\` picks any axis not parallel to dir.
  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(up, dir));
  vec3 t2 = cross(dir, t1);

  // ~3 HEALPix cells (cell ~1e-3 rad at nside=1024). Wide enough that the
  // 8-neighbour ring straddles surrounding cells and the blur actually
  // averages distinct elevation values.
  const float eps = 3.0e-3;
  const float diag = 0.7071;  // 1/sqrt(2) — keeps diagonals at the same arc-length as cardinals

  vec3 d0 = dir;
  vec3 d1 = normalize(dir + t1 * eps);
  vec3 d2 = normalize(dir - t1 * eps);
  vec3 d3 = normalize(dir + t2 * eps);
  vec3 d4 = normalize(dir - t2 * eps);
  vec3 d5 = normalize(dir + (t1 + t2) * eps * diag);
  vec3 d6 = normalize(dir + (t1 - t2) * eps * diag);
  vec3 d7 = normalize(dir - (t1 - t2) * eps * diag);
  vec3 d8 = normalize(dir - (t1 + t2) * eps * diag);

  ivec2 tx0 = cellTexel(d0);
  ivec2 tx1 = cellTexel(d1);
  ivec2 tx2 = cellTexel(d2);
  ivec2 tx3 = cellTexel(d3);
  ivec2 tx4 = cellTexel(d4);
  ivec2 tx5 = cellTexel(d5);
  ivec2 tx6 = cellTexel(d6);
  ivec2 tx7 = cellTexel(d7);
  ivec2 tx8 = cellTexel(d8);

  float elev = (
    texelFetch(uElevationMeters, tx0, 0).r +
    texelFetch(uElevationMeters, tx1, 0).r +
    texelFetch(uElevationMeters, tx2, 0).r +
    texelFetch(uElevationMeters, tx3, 0).r +
    texelFetch(uElevationMeters, tx4, 0).r +
    texelFetch(uElevationMeters, tx5, 0).r +
    texelFetch(uElevationMeters, tx6, 0).r +
    texelFetch(uElevationMeters, tx7, 0).r +
    texelFetch(uElevationMeters, tx8, 0).r
  ) / 9.0;

  int oceanCount = 0;
  if (texelFetch(uIdRaster, tx1, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx2, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx3, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx4, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx5, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx6, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx7, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx8, 0).r == 0u) oceanCount++;

  // Quadratic taper: 0 ocean → 1.0, 4 ocean → 0.25, 8 ocean → 0.0.
  float coastFade = 1.0 - float(oceanCount) / 8.0;
  coastFade *= coastFade;

  float displace = max(elev, 0.0) * uElevationScale * coastFade;
  vec3 displaced = dir * (1.0 + displace);

  vec4 wp = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,c0=`// Land fragment shader — climate-driven biome shading on the dry-land
// icosphere. Ocean cells are NOT discarded; coastlines fade to alpha 0
// and the separate water mesh paints the ocean.
//
// Pipeline (each step composes on top of the previous):
//   1. Biome blend            — 9-tap equal-weight neighbour average over
//                               the 12-entry biome palette (codes 0..11
//                               from \`attrs.yaml\` ESA-WorldCover remap).
//                               Ocean neighbours don't pull their colour
//                               into the blend (avoids blue bleed) but
//                               they bump \`oceanCount\` for the alpha fade.
//   2. Coast alpha fade       — fragAlpha = 1 - smoothstep(1, 6, oceanCount).
//                               Combined with \`alphaToCoverage\` on the
//                               material, cell-stepped coastlines dissolve
//                               into the water mesh without a hard edge.
//   3. Alpine thinning        — biome colour blends toward bare-rock
//                               grey-tan (\`ALPINE_BARE\`) as elevation
//                               rises 1.5 → 4 km. Strength = \`uAlpineStrength\`.
//   4. Cold tint              — below +22 °C the biome blends toward a
//                               dusty grey-tan (\`COLD_TONE\`); fully
//                               saturates at -2 °C, max 95 % blend.
//                               Differentiates cold deserts (Patagonia,
//                               Gobi, Tibet) from hot ones (Sahara) —
//                               both share biome code 6.
//   5. Hot tint               — above +22 °C, mild blend toward dry tan
//                               (\`HOT_DRY\`), max 25 %. Sun-baked look.
//   6. Snow line              — \`uColorIce\` blend driven by effective
//                               temperature (smoothstep -10 → -1 °C).
//                               WorldClim BIO1 already encodes altitude,
//                               so the snow line is NOT lapse-corrected
//                               (would double-count and over-snow
//                               equatorial mountains).
//   7. Dynamic recolour       — fire / ice / infection / pollution from
//                               \`attribute_dynamic\` (sim writes here).
//   8. Wrap-Lambert lighting  — Sobel-tilted normal, day/night wrap with
//                               soft falloff so lee-side slopes stay
//                               legible.
//
// Effective temperature for steps 4/5/6: \`temperatureC + uSeasonOffsetC\`.
// One slider rolls the whole globe between summer and winter — snow
// recedes/spreads, cold tint shrinks/grows, all coherent.
//
// \`vColor\` is intentionally unused — a per-body tint LUT is a follow-up.

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

uniform vec3 uSunDirection;
uniform vec3 uNightTint;
uniform float uAmbient;

uniform highp usampler2D uIdRaster;
uniform sampler2D uAttrStatic;
uniform sampler2D uAttrClimate;
uniform sampler2D uAttrDynamic;
uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;

uniform vec3 uColorFire;
uniform vec3 uColorIce;
uniform vec3 uColorInfection;
uniform vec3 uColorPollution;
uniform vec4 uLerpStrength;

uniform float uBiomeStrength;
uniform float uSnowLineStrength;

// Global temperature offset in °C added to every cell's baked annual-mean
// temperature before any temperature-driven effect (snow line, cold/hot
// color tint). 0 = baseline; negative = winter; positive = summer.
uniform float uSeasonOffsetC;

// Alpine thinning strength: how strongly the biome colour fades toward
// bare-rock grey-tan as elevation rises from 1.5 km to 4 km. 0 = no
// effect; 1 = full bare-rock at 4 km+.
uniform float uAlpineStrength;

in vec3 vWorldPos;
in vec3 vSphereDir;

out vec4 fragColor;

// Biome destination palette. Indexed by canonical biome_class code
// (matches \`data-pipeline/config/attrs.yaml\` esa_worldcover remap).
//   0  no data / fallback     — vec3(0)         passthrough → ocean tone
//   1  tree cover (forest)    — deep green
//   2  shrubland              — olive / khaki
//   3  grassland              — light olive
//   4  cropland               — wheat / mustard
//   5  built-up               — neutral grey
//   6  bare / sparse veg      — desert tan
//   7  snow & ice             — pale blue-white
//   8  permanent water        — mid blue
//   9  herbaceous wetland     — muted teal-green
//  10  mangroves              — dark teal-green
//  11  moss & lichen / tundra — pale grey-blue
vec3 biomePalette(int code) {
  if (code <= 0) return vec3(0.55, 0.5, 0.4);    // landfall fallback (sand-ish)
  if (code == 1)  return vec3(0.157, 0.431, 0.235);
  if (code == 2)  return vec3(0.522, 0.541, 0.298);
  if (code == 3)  return vec3(0.553, 0.659, 0.345);
  if (code == 4)  return vec3(0.745, 0.706, 0.380);
  if (code == 5)  return vec3(0.451, 0.439, 0.424);
  if (code == 6)  return vec3(0.882, 0.765, 0.510);
  if (code == 7)  return vec3(0.882, 0.922, 0.961);
  if (code == 8)  return vec3(0.235, 0.510, 0.784);
  if (code == 9)  return vec3(0.353, 0.510, 0.431);
  if (code == 10) return vec3(0.235, 0.412, 0.314);
  if (code == 11) return vec3(0.706, 0.765, 0.784);
  return vec3(0.55, 0.5, 0.4);
}

// Shoreline tint used when a neighbour cell is ocean (bodyId == 0).
// Matches the water shader's \`uOceanShallow\` so coastal land fades toward
// the same blue the water mesh is painting next to it.
const vec3 SHORE_BLUE = vec3(0.239, 0.651, 0.761);

// Sample a neighbour cell. \`.rgb\` is its biome colour OR the supplied
// \`fallback\` (centre colour) if it's ocean — so ocean neighbours don't
// pull foreign colour into the blend, they only contribute to the alpha
// fade via \`.a == 1.0\`. The summed alpha across the 8 neighbours drives
// the coast-coverage value the alpha-to-coverage path consumes.
vec4 neighbourSample(ivec2 t, vec3 fallback) {
  uint bid = texelFetch(uIdRaster, t, 0).r;
  if (bid == 0u) return vec4(fallback, 1.0);
  int b = int(texelFetch(uAttrStatic, t, 0).g * 255.0 + 0.5);
  return vec4(biomePalette(b), 0.0);
}

void main() {
  // Tangent basis matching the vertex shader.
  vec3 dir = normalize(vSphereDir);
  vec3 nUp = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(nUp, dir));
  vec3 t2 = cross(dir, t1);

  // ----- Normal: 8-neighbour Sobel gradient at 4 cells -----
  // The straight central-difference gradient was a step function (raw cell
  // elevations on either side, snapping as fragments cross cell edges) and
  // produced visible banding. The Sobel kernel's [1,2,1] weighting acts as
  // a tiny Gaussian blur on the gradient itself — smoother slopes, no
  // banding. Slope is clamped so a single-cell elevation cliff can't tilt
  // the normal nearly horizontal.
  const float nEps = 4.0e-3;
  const float nDiag = 0.7071;
  vec3 nDe  = normalize(dir + t1 * nEps);
  vec3 nDw  = normalize(dir - t1 * nEps);
  vec3 nDn  = normalize(dir + t2 * nEps);
  vec3 nDs  = normalize(dir - t2 * nEps);
  vec3 nDne = normalize(dir + (t1 + t2) * nEps * nDiag);
  vec3 nDnw = normalize(dir + (-t1 + t2) * nEps * nDiag);
  vec3 nDse = normalize(dir + (t1 - t2) * nEps * nDiag);
  vec3 nDsw = normalize(dir + (-t1 - t2) * nEps * nDiag);
  ivec2 ntxE  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDe.z,  atan(nDe.y,  nDe.x)),  uAttrTexWidth);
  ivec2 ntxW  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDw.z,  atan(nDw.y,  nDw.x)),  uAttrTexWidth);
  ivec2 ntxN  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDn.z,  atan(nDn.y,  nDn.x)),  uAttrTexWidth);
  ivec2 ntxS  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDs.z,  atan(nDs.y,  nDs.x)),  uAttrTexWidth);
  ivec2 ntxNE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDne.z, atan(nDne.y, nDne.x)), uAttrTexWidth);
  ivec2 ntxNW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDnw.z, atan(nDnw.y, nDnw.x)), uAttrTexWidth);
  ivec2 ntxSE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDse.z, atan(nDse.y, nDse.x)), uAttrTexWidth);
  ivec2 ntxSW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, nDsw.z, atan(nDsw.y, nDsw.x)), uAttrTexWidth);
  float eE  = max(texelFetch(uElevationMeters, ntxE,  0).r, 0.0);
  float eW  = max(texelFetch(uElevationMeters, ntxW,  0).r, 0.0);
  float eN  = max(texelFetch(uElevationMeters, ntxN,  0).r, 0.0);
  float eS  = max(texelFetch(uElevationMeters, ntxS,  0).r, 0.0);
  float eNE = max(texelFetch(uElevationMeters, ntxNE, 0).r, 0.0);
  float eNW = max(texelFetch(uElevationMeters, ntxNW, 0).r, 0.0);
  float eSE = max(texelFetch(uElevationMeters, ntxSE, 0).r, 0.0);
  float eSW = max(texelFetch(uElevationMeters, ntxSW, 0).r, 0.0);
  // Sobel kernel: divisor 8 (sum of positive weights × distance ≈ 8·eps).
  float Gx = (eNE + 2.0 * eE + eSE) - (eNW + 2.0 * eW + eSW);
  float Gy = (eNW + 2.0 * eN + eNE) - (eSW + 2.0 * eS + eSE);
  float slopeT1 = clamp(Gx * uElevationScale / (8.0 * nEps), -0.6, 0.6);
  float slopeT2 = clamp(Gy * uElevationScale / (8.0 * nEps), -0.6, 0.6);
  vec3 n = normalize(dir - slopeT1 * t1 - slopeT2 * t2);

  // Use the *pre-displacement* direction for HEALPix lookups so the cell
  // we sample matches the cell that produced the displacement at this
  // vertex — not the cell the displaced position happens to fall on.
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, vSphereDir.z, atan(vSphereDir.y, vSphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);

  uint bodyId = texelFetch(uIdRaster, tx, 0).r;
  // No discard. Coast coverage is handled below via fragAlpha + the
  // material's alphaToCoverage flag.

  // Land: biome → alpine thinning → temp tint → snow line → dynamic recolour.
  // ----- Biome blend: 9-tap equal-weight at ~3 cells (aggressive) -----
  // Centre and 8 neighbours all weighted equally. Wide radius means
  // neighbouring biomes bleed multiple cells into each other → sharp
  // categorical jumps melt into smooth multi-cell gradients.
  vec4 staticTexel = texelFetch(uAttrStatic, tx, 0);
  int biomeC = int(staticTexel.g * 255.0 + 0.5);

  const float bEps = 6.0e-3;
  const float bDiag = 0.7071;
  vec3 bDe  = normalize(dir + t1 * bEps);
  vec3 bDw  = normalize(dir - t1 * bEps);
  vec3 bDn  = normalize(dir + t2 * bEps);
  vec3 bDs  = normalize(dir - t2 * bEps);
  vec3 bDne = normalize(dir + (t1 + t2) * bEps * bDiag);
  vec3 bDnw = normalize(dir + (-t1 + t2) * bEps * bDiag);
  vec3 bDse = normalize(dir + (t1 - t2) * bEps * bDiag);
  vec3 bDsw = normalize(dir + (-t1 - t2) * bEps * bDiag);
  ivec2 btxE  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDe.z,  atan(bDe.y,  bDe.x)),  uAttrTexWidth);
  ivec2 btxW  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDw.z,  atan(bDw.y,  bDw.x)),  uAttrTexWidth);
  ivec2 btxN  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDn.z,  atan(bDn.y,  bDn.x)),  uAttrTexWidth);
  ivec2 btxS  = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDs.z,  atan(bDs.y,  bDs.x)),  uAttrTexWidth);
  ivec2 btxNE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDne.z, atan(bDne.y, bDne.x)), uAttrTexWidth);
  ivec2 btxNW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDnw.z, atan(bDnw.y, bDnw.x)), uAttrTexWidth);
  ivec2 btxSE = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDse.z, atan(bDse.y, bDse.x)), uAttrTexWidth);
  ivec2 btxSW = healpixIpixToTexel(healpixZPhiToPix(uHealpixNside, uHealpixOrdering, bDsw.z, atan(bDsw.y, bDsw.x)), uAttrTexWidth);
  float temperatureC = texelFetch(uAttrClimate, tx, 0).r;
  vec4 dyn = clamp(texelFetch(uAttrDynamic, tx, 0) * uLerpStrength,
                   vec4(0.0), vec4(1.0));

  // Equal-weight 9-tap. Ocean neighbours contribute the centre's biome
  // (no foreign colour pulled in) and bump the alpha-fade counter via
  // their \`.a\` channel.
  vec3 centerColor = biomePalette(biomeC);
  vec4 nE_  = neighbourSample(btxE,  centerColor);
  vec4 nW_  = neighbourSample(btxW,  centerColor);
  vec4 nN_  = neighbourSample(btxN,  centerColor);
  vec4 nS_  = neighbourSample(btxS,  centerColor);
  vec4 nNE_ = neighbourSample(btxNE, centerColor);
  vec4 nNW_ = neighbourSample(btxNW, centerColor);
  vec4 nSE_ = neighbourSample(btxSE, centerColor);
  vec4 nSW_ = neighbourSample(btxSW, centerColor);
  vec3 base = (
    centerColor +
    nE_.rgb + nW_.rgb + nN_.rgb + nS_.rgb +
    nNE_.rgb + nNW_.rgb + nSE_.rgb + nSW_.rgb
  ) * (1.0 / 9.0);
  float oceanCount = nE_.a + nW_.a + nN_.a + nS_.a + nNE_.a + nNW_.a + nSE_.a + nSW_.a;
  if (bodyId == 0u) oceanCount = 8.0;
  // Coast fade: starts at 1 ocean neighbour, fully transparent by 6.
  // Wider band → more dissolve, more "smoothed" coastline.
  float fragAlpha = 1.0 - smoothstep(1.0, 6.0, oceanCount);
  // uBiomeStrength is preserved as a uniform so the existing Tweakpane
  // slider keeps working; it lerps toward a neutral landfall tone.
  base = mix(vec3(0.55, 0.5, 0.4), base, clamp(uBiomeStrength, 0.0, 1.0));

  // Continuous elevation in metres at the centre cell (same texture the
  // vertex shader displaces from). Used for alpine thinning.
  float elevM = max(texelFetch(uElevationMeters, tx, 0).r, 0.0);

  // ----- Alpine thinning -----
  // Smoothly fade the biome colour toward bare-rock grey-tan as elevation
  // rises. Below ~1500 m: untouched. Above ~4000 m: ~70% rock. The blend
  // is \`smoothstep\` so there are no hard altitude lines.
  const vec3 ALPINE_BARE = vec3(0.55, 0.50, 0.45);
  float altThin = smoothstep(1500.0, 4000.0, elevM);
  base = mix(base, ALPINE_BARE, altThin * clamp(uAlpineStrength, 0.0, 1.0));

  // ----- Effective temperature (with season slider) -----
  // Baked WorldClim annual mean + uSeasonOffsetC. Drives both the
  // hot/cold colour tint below and the dynamic snow line. One value
  // means one slider rolls the whole globe between summer and winter.
  float effTempC = temperatureC + uSeasonOffsetC;

  // ----- Cold tint -----
  // Below ~18 °C the biome desaturates toward a muted grey-tan in the
  // same family as the alpine-bare colour. Cold deserts (Patagonia,
  // Gobi, Tibet, Atacama) share the same "bare" biome code as hot
  // deserts, so without a strong tint here they paint identical to
  // the Sahara. Pale-blue "frost" reads wrong on dry rocky desert —
  // dusty grey-tan reads right.
  //
  // Range +22 → -2 °C and 95 % max blend chosen so:
  //   Sahara/Outback (~28 °C)  → 0 %   (untouched)
  //   Mediterranean (~16 °C)    → ~24 % (visibly cooler)
  //   Patagonia (~8 °C)        → ~55 % (cold-desert character)
  //   Tibetan plateau (~3 °C)  → ~75 %
  //   Tundra/polar (-2 °C+)    → 95 %  (almost full takeover)
  const vec3 COLD_TONE = vec3(0.50, 0.48, 0.44);
  float coldBlend = smoothstep(22.0, -2.0, effTempC);
  base = mix(base, COLD_TONE, coldBlend * 0.95);

  // ----- Hot tint -----
  // Above ~22 °C a slight tan/dry tint creeps in (sun-baked vegetation,
  // dry grass). Capped at 25% blend.
  const vec3 HOT_DRY = vec3(0.78, 0.70, 0.50);
  float hotBlend = smoothstep(22.0, 36.0, effTempC);
  base = mix(base, HOT_DRY, hotBlend * 0.25);

  // ----- Snow line -----
  // Driven directly by effective temperature. WorldClim already encodes
  // altitude effects per cell (a 5 km equatorial peak reports its real
  // ~6 °C, not the sea-level value), so adding a lapse-rate term here
  // would double-count and over-snow tropical mountains.
  float snowMix = uSnowLineStrength * (1.0 - smoothstep(-10.0, -1.0, effTempC));
  base = mix(base, uColorIce, clamp(snowMix, 0.0, 1.0));

  base = mix(base, uColorFire, dyn.r);
  base = mix(base, uColorIce, dyn.g);
  base = mix(base, uColorInfection, dyn.b);
  base = mix(base, uColorPollution, dyn.a);

  // Wrap-lambert day/night with a wider band. The Sobel-tilted normal
  // can dip well below 0 on lee-side slopes; with the original [-0.2, 0.6]
  // range those slopes pinned to pure night (very dark). The wider
  // [-0.6, 0.8] range gives a softer falloff so shadowed slopes stay
  // legible.
  vec3 sunDir = normalize(uSunDirection);
  float ndotl = dot(n, sunDir);
  float wrap = smoothstep(-0.6, 0.8, ndotl);
  vec3 day = base * (uAmbient + (1.0 - uAmbient) * max(ndotl, 0.0));
  vec3 night = base * uNightTint;
  fragColor = vec4(mix(night, day, wrap), fragAlpha);
}
`,h0=5,Mu=24e-7,Ri=h0*Mu,u0=25;function Eu(n){return n*Mu}function sh(n){return 1+u0*1e3*Eu(n)}function d0(){const n={uSunDirection:{value:new L(1,0,.3).normalize()},uNightTint:{value:new we(.08,.1,.16)},uAmbient:{value:.3},uIdRaster:{value:null},uAttrStatic:{value:null},uAttrClimate:{value:null},uAttrDynamic:{value:null},uElevationMeters:{value:null},uHealpixNside:{value:1},uHealpixOrdering:{value:0},uAttrTexWidth:{value:1},uElevationScale:{value:Ri},uColorFire:{value:new we("#1a1014")},uColorIce:{value:new we("#d4ecff")},uColorInfection:{value:new we("#bb33cc")},uColorPollution:{value:new we("#7a6a3a")},uLerpStrength:{value:new at(1,1,1,1)},uBiomeStrength:{value:.85},uSnowLineStrength:{value:.55},uSeasonOffsetC:{value:0},uAlpineStrength:{value:.7}},e=`${Mi}
${l0}`,t=`${Mi}
${c0}`,i=new mt({uniforms:n,glslVersion:Vt,vertexShader:e,fragmentShader:t,alphaToCoverage:!0});return Object.defineProperty(i,"_landUniforms",{value:n,enumerable:!1}),i}const p0=512,f0=1;class m0{group=new Un;mesh;geometry;material;constructor(e){this.geometry=new oa(f0,p0),this.material=d0();const t=this.material._landUniforms;t.uIdRaster.value=e.getIdRaster(),t.uAttrStatic.value=e.getAttributeTexture("elevation"),t.uAttrClimate.value=e.getAttributeTexture("temperature"),t.uAttrDynamic.value=e.getAttributeTexture("fire"),t.uElevationMeters.value=e.getElevationMetersTexture();const{nside:i,ordering:r}=e.getHealpixSpec();t.uHealpixNside.value=i,t.uHealpixOrdering.value=r==="ring"?0:1,t.uAttrTexWidth.value=4*i,this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=0,this.group.add(this.mesh)}get uniforms(){return this.material._landUniforms}setSunDirection(e){this.material._landUniforms.uSunDirection.value.copy(e)}dispose(){for(this.geometry.dispose(),this.material.dispose();this.group.children.length>0;)this.group.remove(this.group.children[0])}}const ah=`// Shared Gerstner-wave helper for the water mesh. Imported by
// water.vert.glsl (for displacement) and water.frag.glsl (for the
// analytic perturbed normal that drives Fresnel + glint).
//
// Each wave is a 3D sinusoid \`A_i * sin(K_i · dir - ω_i * t)\` evaluated on
// the un-displaced unit-sphere direction. Summing 4 waves with mismatched
// directions and frequencies gives a non-repeating, stylized swell.
//
// The "Gerstner" steepness term pinches crests by adding a tangential
// displacement proportional to cos(phase) along the wave direction.
// Steepness 0 = pure sum-of-sines (rounded), 1 = sharp peaks. Q is clamped
// to [0,1] so waves never invert.
//
// Output \`normal\` is the analytic outward normal of the displaced surface
// at \`dir\`: \`normalize(dir - elevScale · ∇_sphere h)\`, where ∇_sphere is
// the sphere-tangent component of the 3D height gradient. The fragment
// shader uses this directly (no normal map, no varying interpolation).

#define WATER_NUM_WAVES 4

void waterWaves(
  in vec3 dir,
  in float t,
  in float amplitudeM,
  in float steepness,
  in float elevScale,
  out float radialM,
  out vec3 tangent,
  out vec3 normal
) {
  // Wave 3D wave-vectors. Magnitudes ~22–25 → wavelengths ~0.25–0.28 of
  // unit radius (~1700 km on a 6371 km Earth — ocean-swell scale).
  vec3 K[WATER_NUM_WAVES];
  K[0] = vec3( 19.0,  11.0,   5.0);
  K[1] = vec3(-13.0,  17.0,   7.0);
  K[2] = vec3( 23.0,  -9.0,  -3.0);
  K[3] = vec3(  7.0,  13.0,  19.0);

  // Per-wave amplitude weights (sum = 2.3, normalized below) and angular
  // frequencies. Spread over a ~2× range so the swell never resyncs.
  float ampW[WATER_NUM_WAVES];
  ampW[0] = 1.00;
  ampW[1] = 0.60;
  ampW[2] = 0.40;
  ampW[3] = 0.30;
  float ampSum = 2.30;

  float omega[WATER_NUM_WAVES];
  omega[0] = 0.55;
  omega[1] = 0.80;
  omega[2] = 1.05;
  omega[3] = 0.40;

  float Q = clamp(steepness, 0.0, 1.0);

  radialM = 0.0;
  tangent = vec3(0.0);
  vec3 dh = vec3(0.0); // 3D gradient of height (m / unit-radius).

  for (int i = 0; i < WATER_NUM_WAVES; ++i) {
    vec3 Ki = K[i];
    float kLen = max(length(Ki), 1e-4);
    vec3 T = Ki - dot(Ki, dir) * dir; // sphere-tangent component of K.
    float phase = dot(dir, Ki) - omega[i] * t;
    float a = amplitudeM * ampW[i] / ampSum;
    float s = sin(phase);
    float c = cos(phase);
    radialM += a * s;
    // Gerstner horizontal pinch: small tangential offset along K_tangent.
    // Convert from metres to unit-radius via elevScale, normalize by k so
    // the offset stays bounded.
    tangent += Q * a * elevScale * (T / kLen) * c;
    // Gradient of \`a * sin(K · dir - ω t)\` w.r.t. position dir = a * cos * K.
    dh += a * c * Ki;
  }

  vec3 dhUnit = dh * elevScale; // metres → unit-radius units.
  vec3 dhTan = dhUnit - dot(dhUnit, dir) * dir; // sphere-tangent gradient.
  normal = normalize(dir - dhTan);
}
`,v0=`// Water vertex shader — displaces every vertex to (water-surface +
// Gerstner-wave) elevation. The base water surface comes from
// \`uWaterLevelMeters\` (R16F, half-float metres; v1 init = 0 = sea level).
// The wave term is computed by \`waterWaves()\` (water_waves.glsl), summing
// 4 sinusoids on the un-displaced direction so phase is stable across
// frames at any zoom.
//
// Wave amplitude is attenuated by \`coastFade\` (a smoothstep over water
// depth = waterLevel - landElev) so coastlines stay calm and only deep
// open water swells.
//
// \`vSphereDir\` carries the un-displaced direction so the fragment shader
// can re-look-up its HEALPix cell + recompute the analytic wave normal
// without drift from the displaced position. \`vWaterSurface\` carries the
// metres value the fragment shader uses for depth tint and discard logic.
// \`vWorldPos\` carries the actual displaced world position for view-vector
// lookups (Fresnel + sun glint).

precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uWaterLevelMeters;
uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uWaterRadialBias;

uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveSpeed;
uniform float uWaveSteepness;

out vec3 vSphereDir;
out float vWaterSurface;
out vec3 vWorldPos;

void main() {
  vec3 dir = normalize(position);
  vSphereDir = dir;

  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, dir.z, atan(dir.y, dir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float waterLevel = texelFetch(uWaterLevelMeters, tx, 0).r;
  float landElev = texelFetch(uElevationMeters, tx, 0).r;
  vWaterSurface = waterLevel;

  float depth = max(waterLevel - landElev, 0.0);
  float coastFade = smoothstep(0.0, 400.0, depth);
  float ampAtt = uWaveAmplitude * coastFade;

  float waveRadialM;
  vec3 waveTangent;
  vec3 waveNormal_;
  waterWaves(
    dir,
    uTime * uWaveSpeed,
    ampAtt,
    uWaveSteepness,
    uElevationScale,
    waveRadialM,
    waveTangent,
    waveNormal_
  );

  float displace = (waterLevel + waveRadialM) * uElevationScale + uWaterRadialBias;
  vec3 surfaceObj = dir * (1.0 + displace) + waveTangent;
  vec4 wp = modelMatrix * vec4(surfaceObj, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,g0=`// Water fragment shader — paints the water shell over ocean cells.
//
// Lighting normal is built in three layers:
//   1. The un-displaced sphere direction \`vSphereDir\` is the base.
//   2. \`waterWaves()\` (water_waves.glsl) adds a 4-Gerstner-wave swell —
//      the big "ocean rises and falls" silhouette you see at orbital zoom.
//   3. \`detailRippleNormal()\` adds a 3-octave value-noise gradient — the
//      fine shimmer that catches sun glint at every scale and is what
//      makes water look like water rather than displaced terrain.
//
// Both wave layers are attenuated by \`coastFade\` (a smoothstep over water
// depth = waterSurface - landElev), so coastlines stay calm and only the
// open ocean ripples at full strength.
//
// Depth tint mixes \`uOceanDeep\` → \`uOceanShallow\` over the first ~4 km of
// water. Specular cone is tight (pow 220) so the glint reads as crisp
// sparkles on the wave crests; Schlick Fresnel adds a sky-tinted rim at
// grazing angles, gated to the day side via the wrap term.
//
// No discard. The land mesh discards ocean cells, and where land elevation
// is taller than the water surface it draws front-most by depth test.

precision highp float;
precision highp int;
precision highp usampler2D;

uniform vec3 uSunDirection;
uniform vec3 uNightTint;
uniform float uAmbient;

uniform highp usampler2D uIdRaster;
uniform sampler2D uElevationMeters;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;

uniform vec3 uOceanDeep;
uniform vec3 uOceanShallow;

uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveSpeed;
uniform float uWaveSteepness;
uniform float uFresnelStrength;

// Ocean current visualisation. RG16F equirectangular m/s (u east, v north).
// Land cells store (0, 0) so length() gates rendering. Strength is the
// Tweakpane intensity; 0 hides the overlay, 1 is the default subtle look.
uniform sampler2D uOceanCurrents;
uniform float uCurrentStrength;
uniform float uStreamlinesEnabled;
uniform float uStrongJetsOnly;

in vec3 vSphereDir;
in float vWaterSurface;
in vec3 vWorldPos;

out vec4 fragColor;

// 3D value-noise helpers (Hugo Elias / Dave Hoskins style hash) used to
// build the high-frequency normal perturbation that gives water its
// shimmer. Inlined here so the chunk concatenation in WaterMaterial.ts
// stays small; only the fragment shader needs them.
float wn_hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float wn_noise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = wn_hash13(p);
  float n100 = wn_hash13(p + vec3(1.0, 0.0, 0.0));
  float n010 = wn_hash13(p + vec3(0.0, 1.0, 0.0));
  float n110 = wn_hash13(p + vec3(1.0, 1.0, 0.0));
  float n001 = wn_hash13(p + vec3(0.0, 0.0, 1.0));
  float n101 = wn_hash13(p + vec3(1.0, 0.0, 1.0));
  float n011 = wn_hash13(p + vec3(0.0, 1.0, 1.0));
  float n111 = wn_hash13(p + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float wn_fbm(vec3 p, int octaves) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < octaves; ++i) {
    v += a * wn_noise3(p);
    p = p * 2.03 + vec3(0.71, 0.13, 0.49);
    a *= 0.5;
  }
  return v;
}

// Sample the ocean-current vector (m/s, lat-tangent frame: u east, v north)
// at a sphere direction. Equirect mapping mirrors the wind field sampler
// in the cloud shader: u = (lon + π) / 2π, v = 0.5 - lat / π. Land cells
// return (0, 0) so callers can use \`length(c) > 0\` as an ocean gate.
vec2 sampleCurrentLatLon(vec3 dir) {
  const float PI_ = 3.14159265359;
  float lat = asin(clamp(dir.z, -1.0, 1.0));
  float lon = atan(dir.y, dir.x);
  vec2 uv = vec2((lon + PI_) / (2.0 * PI_), 0.5 - lat / PI_);
  return texture(uOceanCurrents, uv).rg;
}

// Streamline overlay: computes a low-contrast brightness-add at the
// current fragment, animated to flow along the local current direction.
// Cheap LIC-flavoured technique:
//   - sample 3D FBM at a position drifted FORWARD along the current by
//     accumulated time (so the noise pattern moves WITH the flow);
//   - shape it into narrow ridges via a smoothstep on the noise value;
//   - gate by speed (kills noise in calm interiors and on land where
//     current is exactly 0) and by \`coastFade\` (so the literal
//     coastline stays clean).
//
// Returns an RGB additive term; ready to scale by \`uCurrentStrength\`
// and the day-side \`wrap\` factor at the call site.
vec3 streamlineOverlay(vec3 dir, float coastFade, float wrap) {
  vec2 cur = sampleCurrentLatLon(dir);
  float speed = length(cur);
  if (speed < 0.02) return vec3(0.0);

  // Speed gate: gentle (most surface currents) vs strong-jets-only
  // (Gulf Stream / Kuroshio / ACC). Toggle in Tweakpane.
  float speedVis = mix(
    smoothstep(0.65, 0.95, speed),
    smoothstep(0.40, 0.80, speed),
    uStrongJetsOnly
  );

  // Speed heatmap: cool-blue tint scaled by speed. Doesn't show direction
  // but makes "where currents are" unambiguous — Gulf Stream / Kuroshio /
  // ACC pop as bright bands rather than fluffy patches.
  vec3 tintColor = vec3(0.02, 0.05, 0.06);
  return tintColor * speedVis * coastFade * wrap * uStreamlinesEnabled;
}

// Tilt the outward normal by the gradient of an animated FBM, expressed
// in the sphere-tangent frame at \`dir\`. \`strength\` is the deviation in
// unit-radius units (small — typical 0.005–0.025). \`K\` is the base wave-
// number — larger K = smaller, finer ripples; smaller K = larger, slower-
// rolling ripples. \`driftAxis\` rotates the scroll direction so two layers
// don't lock into the same flow. 3 FBM lookups per call (one reference,
// two tangent finite-diff samples); each FBM is 3 octaves of value noise.
vec3 detailRippleNormal(vec3 dir, float t, float strength, float K, vec3 driftAxis, int octaves) {
  vec3 tup = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tx = normalize(cross(tup, dir));
  vec3 ty = cross(dir, tx);

  // eps in pre-K units; the gradient divides by eps so the result is
  // the spatial derivative of the noise field at this scale.
  float eps = 0.0008;
  vec3 drift = driftAxis * t;

  float n0 = wn_fbm(dir * K + drift, octaves);
  float nx = wn_fbm((dir + tx * eps) * K + drift, octaves);
  float ny = wn_fbm((dir + ty * eps) * K + drift, octaves);

  vec2 grad = vec2(nx - n0, ny - n0) / eps;
  return normalize(dir - (tx * grad.x + ty * grad.y) * strength);
}

void main() {
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, vSphereDir.z, atan(vSphereDir.y, vSphereDir.x));
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  float landElev = texelFetch(uElevationMeters, tx, 0).r;

  // Depth tint: deeper water = darker.
  float depth = max(vWaterSurface - landElev, 0.0);
  float depthT = 1.0 - clamp(depth / 4000.0, 0.0, 1.0);
  vec3 base = mix(uOceanDeep, uOceanShallow, depthT);

  // Coast fade: same formula as the vertex shader so swell + glint
  // attenuate together. 0 m depth → 0, 400 m depth → full.
  float coastFade = smoothstep(0.0, 400.0, depth);
  float ampAtt = uWaveAmplitude * coastFade;

  // Depth-varying Fresnel: shallow/coast water reflects the sky more
  // strongly than open ocean. 0.3 at coast → 0.1 in deep water.
  // \`uFresnelStrength\` (Tweakpane) scales the result on top.
  float fresnelMix = mix(0.3, 0.1, coastFade);

  // Layer 1: low-frequency Gerstner swell — analytic perturbed normal.
  float waveRadialM_;
  vec3 waveTangent_;
  vec3 waveNormal;
  waterWaves(
    vSphereDir,
    uTime * uWaveSpeed,
    ampAtt,
    uWaveSteepness,
    uElevationScale,
    waveRadialM_,
    waveTangent_,
    waveNormal
  );

  // Layer 2: medium ripple shimmer — features sized between the old
  // "tiny" K=180 and the deep-only "big rolling" K=50. K=110 lands
  // ~halfway, with strength bumped (0.020) so the effective tilt stays
  // visually similar to the old fine layer despite the lower K.
  // Strength is gently faded near coast (40 % at shore → 100 % at
  // deep) so shore ripples are calmer than open ocean without going
  // fully static — the animation still reaches the coast.
  float fineRippleFade = mix(0.15, 1.0, coastFade);
  vec3 detailFine = detailRippleNormal(
    vSphereDir,
    uTime * uWaveSpeed,
    0.020 * fineRippleFade,
    110.0,
    vec3(0.31, 0.17, -0.23),
    3
  );

  // Layer 3: bigger rolling ripples — larger features (low K), stronger
  // tilt. \`coastFade * coastFade\` ramps in only over deep water, so the
  // shore look stays clean and the open ocean gets visibly different
  // texture (broader, slower-moving patterns) than the shore. Reduced
  // to 2 octaves: this layer is already big features, so the smallest
  // sub-detail isn't doing visible work — saves ~1/6 of total ripple
  // cost without affecting the look.
  float bigRippleMix = coastFade * coastFade;
  vec3 detailBig = detailRippleNormal(
    vSphereDir,
    uTime * uWaveSpeed,
    0.028 * bigRippleMix,
    50.0,
    vec3(-0.19, 0.27, 0.41),
    2
  );

  // Combine: each normal is \`vSphereDir + tangent_offset\`. Summing the
  // three normals and subtracting (n-1)·vSphereDir gives a re-normalizable
  // vector whose tangent component is the sum of the three perturbations.
  vec3 n = normalize(waveNormal + detailFine + detailBig - 2.0 * vSphereDir);

  vec3 sunDir = normalize(uSunDirection);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Wrap-lambert day/night blend matching Land + the previous water look.
  float ndotl = dot(n, sunDir);
  float wrap = smoothstep(-0.2, 0.6, ndotl);
  vec3 day = base * (uAmbient + (1.0 - uAmbient) * max(ndotl, 0.0));
  vec3 night = base * uNightTint;
  vec3 col = mix(night, day, wrap);

  // Specular sun glint — tight cone (pow 220) so the highlight reads as
  // sparkles on individual ripples rather than a wide hot patch. Gated to
  // the day side. The 2.0× multiplier keeps the peak bright after
  // tightening.
  vec3 halfDir = normalize(sunDir + viewDir);
  float spec = pow(max(dot(n, halfDir), 0.0), 220.0);
  float sunMask = smoothstep(0.0, 0.15, ndotl);
  col += vec3(1.0, 0.97, 0.85) * spec * fresnelMix * uFresnelStrength * 2.0 * sunMask;

  // Schlick Fresnel sky tint — adds a brighter rim at grazing angles on
  // the day side. Cheap proxy for "ocean reflects the sky."
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 5.0);
  vec3 skyTint = vec3(0.55, 0.70, 0.95);
  col += skyTint * fresnel * fresnelMix * uFresnelStrength * 0.25 * wrap;

  // Surface current streamline overlay — additive, day-side only, faded
  // toward shore so the literal coastline stays clean. The overlay is
  // gated on \`uCurrentStrength\`; Tweakpane drops it to 0 to disable.
  if (uCurrentStrength > 0.0) {
    col += streamlineOverlay(vSphereDir, coastFade, wrap) * uCurrentStrength;
  }

  fragColor = vec4(col, 1.0);
}
`,_0=36e-5,x0=150,b0=1,y0=.5,w0=1,S0=1;function M0(){const n={uSunDirection:{value:new L(1,0,.3).normalize()},uNightTint:{value:new we(.04,.05,.09)},uAmbient:{value:.18},uIdRaster:{value:null},uElevationMeters:{value:null},uWaterLevelMeters:{value:null},uHealpixNside:{value:1},uHealpixOrdering:{value:0},uAttrTexWidth:{value:1},uElevationScale:{value:Ri},uWaterRadialBias:{value:_0},uOceanDeep:{value:new we("#0a2a4f")},uOceanShallow:{value:new we("#3da6c2")},uTime:{value:0},uWaveAmplitude:{value:x0},uWaveSpeed:{value:b0},uWaveSteepness:{value:y0},uFresnelStrength:{value:w0},uOceanCurrents:{value:null},uCurrentStrength:{value:S0},uStreamlinesEnabled:{value:1},uStrongJetsOnly:{value:0}},e=`${Mi}
${ah}
${v0}`,t=`${Mi}
${ah}
${g0}`,i=new mt({uniforms:n,glslVersion:Vt,vertexShader:e,fragmentShader:t});return Object.defineProperty(i,"_waterUniforms",{value:n,enumerable:!1}),i}const E0=7,T0=1;class C0{group=new Un;mesh;geometry;material;constructor(e){this.geometry=new oa(T0,E0),this.material=M0();const t=this.material._waterUniforms;t.uIdRaster.value=e.getIdRaster(),t.uElevationMeters.value=e.getElevationMetersTexture(),t.uWaterLevelMeters.value=e.getWaterLevelMetersTexture(),t.uOceanCurrents.value=e.getOceanCurrentsTexture();const{nside:i,ordering:r}=e.getHealpixSpec();t.uHealpixNside.value=i,t.uHealpixOrdering.value=r==="ring"?0:1,t.uAttrTexWidth.value=4*i,this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=1,this.group.add(this.mesh)}get uniforms(){return this.material._waterUniforms}setSunDirection(e){this.material._waterUniforms.uSunDirection.value.copy(e)}dispose(){for(this.geometry.dispose(),this.material.dispose();this.group.children.length>0;)this.group.remove(this.group.children[0])}}class A0{group=new Un;land;water;constructor(e){this.land=new m0(e),this.water=new C0(e),this.group.add(this.land.group,this.water.group)}get uniforms(){return{land:this.land.uniforms,water:this.water.uniforms}}setSunDirection(e){this.land.setSunDirection(e),this.water.setSunDirection(e)}dispose(){for(this.land.dispose(),this.water.dispose();this.group.children.length>0;)this.group.remove(this.group.children[0])}}const la=`// Hillaire 2020 atmosphere — shared physical constants & helpers (GLSL3).
//
// All distances are in *unit-sphere* units where 1.0 = planet radius. The
// atmosphere shell radius is driven by \`uAtmosphereRadius\` so it can scale
// with the project's altitude exaggeration knob (Tweakpane → Altitude).
// \`100 km\` of real atmosphere is mapped onto the shell, so changing the
// radius dilates the integration domain while preserving the column-integral
// optical depth.
//
// See \`docs/adr/0007-bruneton-hillaire-atmosphere.md\` and the reference
// at \`jeantimex/precomputed_atmospheric_scattering\` for the math source.

// GLSL ES 3.00 requires explicit precision before any non-const float decl.
// common.glsl is concatenated before each frag shader, so set it here so the
// function signatures below (e.g. \`float raySphereNearest(...)\`) are valid.
precision highp float;
precision highp sampler2D;

const float PI = 3.14159265359;

const float PLANET_RADIUS = 1.0;

// Atmosphere top is dynamic — driven from JS via Tweakpane → Altitude. All
// derived geometric values (thickness, horizon, km-per-unit conversion) are
// helpers that read this uniform; the GLSL compiler hoists them per draw.
uniform float uAtmosphereRadius;

const float REAL_ATMOS_KM = 100.0;

float atmosThickness() { return uAtmosphereRadius - PLANET_RADIUS; }
float hHorizon() {
  return sqrt(max(0.0, uAtmosphereRadius * uAtmosphereRadius - PLANET_RADIUS * PLANET_RADIUS));
}
float unitPerKm() { return atmosThickness() / REAL_ATMOS_KM; }
float kmPerUnit() { return REAL_ATMOS_KM / max(atmosThickness(), 1e-6); }

// Hillaire 2020 default Earth coefficients (per Mm = mega-meter = 1e6 m).
// Convert to per-km (× 1e-3), then × kmPerUnit() to get per-unit-radius.
// Stylisation multipliers are baked into uRayleighScale / uMieScale uniforms
// at the runtime, so leave the unit conversion only here.
const vec3 RAYLEIGH_BETA_PER_KM = vec3(5.802, 13.558, 33.1) * 1e-3; // 1/km
const float MIE_SCATTERING_PER_KM = 3.996e-3;                       // 1/km
const float MIE_EXTINCTION_PER_KM = MIE_SCATTERING_PER_KM * 1.11;
const vec3 OZONE_ABSORPTION_PER_KM = vec3(0.650, 1.881, 0.085) * 1e-3;

const float RAYLEIGH_SCALE_HEIGHT_KM = 8.0;
const float MIE_SCALE_HEIGHT_KM = 1.2;
const float OZONE_TENT_CENTER_KM = 25.0;
const float OZONE_TENT_HALFWIDTH_KM = 15.0;

// Mie phase parameter (Cornette-Shanks). 0.8 is a typical hazy-day value.
const float MIE_G = 0.8;

// Ray-sphere intersect from \`origin\` along unit \`dir\`. Returns the smallest
// non-negative t such that |origin + t·dir| = radius, or -1 if no hit.
float raySphereNearest(vec3 origin, vec3 dir, float radius) {
  float b = dot(origin, dir);
  float c = dot(origin, origin) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  float sq = sqrt(disc);
  float t0 = -b - sq;
  float t1 = -b + sq;
  if (t0 >= 0.0) return t0;
  if (t1 >= 0.0) return t1;
  return -1.0;
}

// Far hit (largest non-negative t).
float raySphereFar(vec3 origin, vec3 dir, float radius) {
  float b = dot(origin, dir);
  float c = dot(origin, origin) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  return -b + sqrt(disc);
}

// Density profile at altitude in km above ground. Returns vec3 = (Rayleigh, Mie, Ozone)
// number-density relative to ground level. Rayleigh + Mie are exponential;
// ozone is a tent centred on \`OZONE_TENT_CENTER_KM\`.
vec3 sampleDensityKm(float altKm) {
  float rho_R = exp(-altKm / RAYLEIGH_SCALE_HEIGHT_KM);
  float rho_M = exp(-altKm / MIE_SCALE_HEIGHT_KM);
  float rho_O = max(0.0, 1.0 - abs(altKm - OZONE_TENT_CENTER_KM) / OZONE_TENT_HALFWIDTH_KM);
  return vec3(rho_R, rho_M, rho_O);
}

// Extinction (per unit-radius) at altitude km. Caller multiplies by ds in
// unit-radius and exp-integrates.
vec3 extinctionPerUnit(float altKm, float rayleighScale, float mieScale) {
  vec3 d = sampleDensityKm(altKm);
  vec3 sigmaR = RAYLEIGH_BETA_PER_KM * rayleighScale * d.r * kmPerUnit();
  float sigmaMs = MIE_SCATTERING_PER_KM * mieScale * d.g * kmPerUnit();
  float sigmaMa = (MIE_EXTINCTION_PER_KM - MIE_SCATTERING_PER_KM) * mieScale * d.g * kmPerUnit();
  vec3 sigmaO = OZONE_ABSORPTION_PER_KM * d.b * kmPerUnit();
  return sigmaR + vec3(sigmaMs + sigmaMa) + sigmaO;
}

// Scattering coefficients (per unit-radius) at altitude km. These appear in
// the in-scattering integrand (multiplied by phase functions).
struct ScatteringPerUnit {
  vec3 rayleigh;
  float mie;
};

ScatteringPerUnit scatteringPerUnit(float altKm, float rayleighScale, float mieScale) {
  vec3 d = sampleDensityKm(altKm);
  ScatteringPerUnit s;
  s.rayleigh = RAYLEIGH_BETA_PER_KM * rayleighScale * d.r * kmPerUnit();
  s.mie = MIE_SCATTERING_PER_KM * mieScale * d.g * kmPerUnit();
  return s;
}

// Phase functions. cosTheta is angle between view ray and (sun-direction or
// in-scattered light direction).
float phaseRayleigh(float cosTheta) {
  return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
}

float phaseMie(float cosTheta) {
  float g = MIE_G;
  float g2 = g * g;
  float num = (1.0 - g2) * (1.0 + cosTheta * cosTheta);
  float denom = pow(max(0.0, 1.0 + g2 - 2.0 * g * cosTheta), 1.5) * (2.0 + g2);
  return (3.0 / (8.0 * PI)) * num / denom;
}

// LUT mapping: (height-from-center, μ = cos view zenith) → uv ∈ [0,1]² for the
// transmittance LUT. Uses Hillaire 2020 sqrt-parameterisation that compresses
// the horizon transition smoothly.
//
// \`h\` ∈ [PLANET_RADIUS, uAtmosphereRadius]. \`mu\` ∈ [-1, 1].
vec2 transmittanceHmuToUv(float h, float mu) {
  float rho = sqrt(max(0.0, h * h - PLANET_RADIUS * PLANET_RADIUS));
  // Distance along ray to TOA, accounting for ground intersection if mu<0.
  float discr = h * h * (mu * mu - 1.0) + uAtmosphereRadius * uAtmosphereRadius;
  float d = max(0.0, -h * mu + sqrt(max(0.0, discr)));
  float dmin = uAtmosphereRadius - h;
  float dmax = rho + hHorizon();
  float u_mu = (dmax > dmin) ? (d - dmin) / (dmax - dmin) : 0.0;
  float u_r = (hHorizon() > 0.0) ? rho / hHorizon() : 0.0;
  return vec2(clamp(u_mu, 0.0, 1.0), clamp(u_r, 0.0, 1.0));
}

void transmittanceUvToHmu(vec2 uv, out float h, out float mu) {
  float u_mu = clamp(uv.x, 0.0, 1.0);
  float u_r = clamp(uv.y, 0.0, 1.0);
  float rho = u_r * hHorizon();
  h = sqrt(rho * rho + PLANET_RADIUS * PLANET_RADIUS);
  float dmin = uAtmosphereRadius - h;
  float dmax = rho + hHorizon();
  float d = u_mu * (dmax - dmin) + dmin;
  if (d <= 1e-6) {
    mu = 1.0;
  } else {
    mu = (hHorizon() * hHorizon() - rho * rho - d * d) / (2.0 * h * d);
  }
  mu = clamp(mu, -1.0, 1.0);
}

// Sample the transmittance LUT given (height-from-center, μ).
vec3 sampleTransmittance(sampler2D lut, float h, float mu) {
  vec2 uv = transmittanceHmuToUv(h, mu);
  return texture(lut, uv).rgb;
}

// Multi-scattering LUT: parameterised by (height, μ_sun) — both effectively
// linear because multi-scattering is smooth across the horizon.
vec2 multiScatteringHmuToUv(float h, float muSun) {
  float u_mu = 0.5 * muSun + 0.5;          // [-1,1] → [0,1]
  float u_h = (h - PLANET_RADIUS) / atmosThickness();
  return vec2(clamp(u_mu, 0.0, 1.0), clamp(u_h, 0.0, 1.0));
}

void multiScatteringUvToHmu(vec2 uv, out float h, out float muSun) {
  muSun = clamp(uv.x * 2.0 - 1.0, -1.0, 1.0);
  h = PLANET_RADIUS + clamp(uv.y, 0.0, 1.0) * atmosThickness();
}

vec3 sampleMultiScattering(sampler2D lut, float h, float muSun) {
  vec2 uv = multiScatteringHmuToUv(h, muSun);
  return texture(lut, uv).rgb;
}

// Convert a unit-sphere position to altitude in km above ground.
float positionToAltKm(vec3 p) {
  float r = length(p);
  return max(0.0, r - PLANET_RADIUS) * kmPerUnit();
}
`,ca=`// Fullscreen-triangle vertex shader (GLSL3). Used by both the LUT-precompute
// passes (where it just lays a triangle over the render-target) and the
// runtime atmosphere pass (where the fragment reconstructs a world-space
// view ray from \`vUv\`).
//
// Convention: a single triangle with clip-space coords (-1,-1), (3,-1),
// (-1,3). The viewport-clipped screen-space portion of this triangle covers
// [0,1]² in UV. Cheaper than a quad — no shared edge → no overdraw.

out vec2 vUv;

void main() {
  // Three vertex IDs 0,1,2 → clip positions (-1,-1), (3,-1), (-1,3).
  vec2 clip = vec2(
    (gl_VertexID == 1) ?  3.0 : -1.0,
    (gl_VertexID == 2) ?  3.0 : -1.0
  );
  vUv = 0.5 * (clip + 1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`,P0=`// Transmittance LUT (256×64 RGBA16F).
// Output: exp(-∫extinction·ds) along the ray from a point at height \`h\` in
// direction \`μ\` (cos view-zenith) all the way to the top of atmosphere (or
// hits the planet surface — in that case t→ground hit, giving full
// occlusion which the runtime sees as "this sunlight is blocked").
//
// \`common.glsl\` is concatenated above this file at material creation
// (see \`lut/transmittance.ts\`).

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uRayleighScale;
uniform float uMieScale;

const int TRANSMITTANCE_STEPS = 40;

void main() {
  float h, mu;
  transmittanceUvToHmu(vUv, h, mu);

  // Ray from (0, 0, h) along (sqrt(1-μ²), 0, μ). We don't need world axes —
  // the transmittance integral only depends on h(s) along the ray.
  vec3 origin = vec3(0.0, 0.0, h);
  vec3 dir = vec3(sqrt(max(0.0, 1.0 - mu * mu)), 0.0, mu);

  float tTop = raySphereFar(origin, dir, uAtmosphereRadius);
  float tGround = raySphereNearest(origin, dir, PLANET_RADIUS);
  float tEnd = (tGround > 0.0) ? tGround : tTop;
  if (tEnd < 0.0) {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    return;
  }
  float ds = tEnd / float(TRANSMITTANCE_STEPS);

  vec3 opticalDepth = vec3(0.0);
  for (int i = 0; i < TRANSMITTANCE_STEPS; ++i) {
    float t = (float(i) + 0.5) * ds;
    vec3 p = origin + dir * t;
    float altKm = positionToAltKm(p);
    opticalDepth += extinctionPerUnit(altKm, uRayleighScale, uMieScale) * ds;
  }

  vec3 transmittance = exp(-opticalDepth);
  fragColor = vec4(transmittance, 1.0);
}
`,R0=256,D0=64;function L0(n={}){return new Zr({glslVersion:Vt,vertexShader:ca,fragmentShader:`${la}
${P0}`,uniforms:{uRayleighScale:{value:n.rayleighScale??1},uMieScale:{value:n.mieScale??1},uAtmosphereRadius:{value:n.atmosphereRadius??1.07}},depthTest:!1,depthWrite:!1})}const I0=`// Multi-scattering LUT (32×32 RGBA16F).
// For each (height, μ_sun): computes the integrated multi-scattering
// contribution L_2 by averaging single-scatter radiance over a small set of
// directions, then folding the geometric series 1 + ψ + ψ² + … = 1/(1-ψ)
// per Hillaire 2020 §5.5.
//
// Reads the precomputed \`uTransmittance\` LUT.
// Output is in linear radiance, RGB. The runtime pass (or the sky-view LUT)
// looks this up at every march step and adds it to single-scatter.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTransmittance;
uniform float uRayleighScale;
uniform float uMieScale;
uniform vec3 uSolarIrradiance; // top-of-atmosphere solar spectrum (RGB)

const int MS_RAY_DIRS_SQRT = 8;       // 8×8 = 64 directions on the unit sphere
const int MS_RAY_STEPS = 20;          // ray-march per direction

// Sample point's (h, μ_sun) → world-frame: place planet center at origin,
// point at (0,0,h), sun direction parameterised by μ_sun (cos angle from zenith).
//
// Multi-scattering integrand at sample point:
//   L_2(p, ω) = ∫ φ_iso · σ_s(p) · T(p, p+ω·s) · L_sun(p+ω·s) ds
// where the inner is single-scatter from the sun along the ray ω, computed
// by ray-march. The outer integral over ω uses uniform-sphere directions.

vec3 marchDir(int dirIdx, vec3 origin, vec3 dir, vec3 sunDir) {
  // March from \`origin\` along \`dir\`, accumulate single-scatter contribution
  // out to TOA / ground, return integrated radiance.
  float tTop = raySphereFar(origin, dir, uAtmosphereRadius);
  float tGround = raySphereNearest(origin, dir, PLANET_RADIUS);
  float tEnd = (tGround > 0.0) ? tGround : tTop;
  if (tEnd <= 0.0) return vec3(0.0);

  float ds = tEnd / float(MS_RAY_STEPS);
  vec3 transmittanceFromOrigin = vec3(1.0);
  vec3 inscattering = vec3(0.0);

  for (int i = 0; i < MS_RAY_STEPS; ++i) {
    float t = (float(i) + 0.5) * ds;
    vec3 p = origin + dir * t;
    float h = length(p);
    float altKm = max(0.0, h - PLANET_RADIUS) * kmPerUnit();

    vec3 ext = extinctionPerUnit(altKm, uRayleighScale, uMieScale);
    vec3 stepT = exp(-ext * ds);

    ScatteringPerUnit sc = scatteringPerUnit(altKm, uRayleighScale, uMieScale);

    // Sun visibility from this sample point.
    float muSunLocal = dot(normalize(p), sunDir);
    vec3 sunT = sampleTransmittance(uTransmittance, h, muSunLocal);

    // Isotropic phase (per-direction-averaged single-scatter; runtime pass
    // applies the proper phase later for primary scatter).
    vec3 phaseR = vec3(1.0 / (4.0 * PI));
    float phaseM = 1.0 / (4.0 * PI);

    vec3 stepInscatter = (sc.rayleigh * phaseR + sc.mie * phaseM) * sunT * uSolarIrradiance;
    // Riemann segment under exponential transmittance.
    vec3 segment = stepInscatter * (vec3(1.0) - stepT) / max(ext, vec3(1e-6));
    inscattering += transmittanceFromOrigin * segment;
    transmittanceFromOrigin *= stepT;
  }

  return inscattering;
}

void main() {
  float h, muSun;
  multiScatteringUvToHmu(vUv, h, muSun);

  // World frame: planet at origin, point at (0,0,h), sun direction in xz plane
  // with z = μ_sun. (Multi-scatter is rotationally symmetric around z, so this
  // choice is canonical.)
  vec3 origin = vec3(0.0, 0.0, h);
  vec3 sunDir = vec3(sqrt(max(0.0, 1.0 - muSun * muSun)), 0.0, muSun);

  vec3 lumTotal = vec3(0.0);
  vec3 fmsTotal = vec3(0.0);  // luminance ratio for the geometric-series factor
  float invDirCount = 1.0 / (float(MS_RAY_DIRS_SQRT) * float(MS_RAY_DIRS_SQRT));

  // Uniform spherical sampling: 8x8 grid in (cosθ, φ).
  for (int i = 0; i < MS_RAY_DIRS_SQRT; ++i) {
    for (int j = 0; j < MS_RAY_DIRS_SQRT; ++j) {
      float u1 = (float(i) + 0.5) / float(MS_RAY_DIRS_SQRT);
      float u2 = (float(j) + 0.5) / float(MS_RAY_DIRS_SQRT);
      float cosTheta = 1.0 - 2.0 * u1;
      float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
      float phi = 2.0 * PI * u2;
      vec3 dir = vec3(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);

      vec3 L = marchDir(0, origin, dir, sunDir);
      lumTotal += L * invDirCount;

      // Compute albedo-like ratio for ψ_ms: the fraction of light that comes
      // back as multi-scatter. Approximate with \`L / sunIrradiance\`.
      fmsTotal += (L / max(uSolarIrradiance, vec3(1e-6))) * invDirCount;
    }
  }

  // Hillaire Eq. 10: F_ms = L_2nd / (1 - ψ_ms)
  vec3 oneMinusPsi = max(vec3(1.0) - fmsTotal, vec3(1e-3));
  vec3 fms = lumTotal / oneMinusPsi;

  fragColor = vec4(fms, 1.0);
}
`,U0=32,N0=32;function F0(n,e={}){return new Zr({glslVersion:Vt,vertexShader:ca,fragmentShader:`${la}
${I0}`,uniforms:{uTransmittance:{value:n},uRayleighScale:{value:e.rayleighScale??1},uMieScale:{value:e.mieScale??1},uSolarIrradiance:{value:e.solarIrradiance?.clone()??new L(1.474,1.8504,1.91198)},uAtmosphereRadius:{value:e.atmosphereRadius??1.07}},depthTest:!1,depthWrite:!1})}const O0=`// Sky-view LUT (200×100 RGBA16F).
// Pre-rendered atmosphere radiance for each (azimuth-from-sun, view zenith)
// direction, *as seen from the current camera*. Re-rendered on
// \`setSunDirection\` and on camera-distance change. The runtime atmosphere
// fragment shader just samples this — saving the per-screen-pixel ray-march.
//
// Parameterisation:
//   u ∈ [0,1] : view azimuth relative to sun azimuth, [0, 2π] → [0, 1]
//   v ∈ [0,1] : view zenith from camera-local up, [0, π] (linear; we want
//               equal precision through both hemispheres, since "down" is
//               toward the planet and contains the bright limb)

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTransmittance;
uniform sampler2D uMultiScattering;
uniform vec3 uCameraPos;        // world-space, planet at origin
uniform vec3 uSunDirection;     // world-space, normalised
uniform float uRayleighScale;
uniform float uMieScale;
uniform vec3 uSolarIrradiance;

const int SKYVIEW_STEPS = 32;

// Build an orthonormal basis at the camera. The basis vector \`up\` is the
// camera-to-planet "up" direction (away from planet center), \`right\` is
// perpendicular to (up, sunProjected), \`forward\` is up × right.
//
// \`sunDir\` is the sun direction in world space; we project it onto the plane
// perpendicular to \`up\` to get the azimuth reference direction.
void cameraBasis(vec3 cam, vec3 sunDir, out vec3 cUp, out vec3 cAzRef, out vec3 cTangent) {
  cUp = normalize(cam);
  vec3 sunInPlane = sunDir - dot(sunDir, cUp) * cUp;
  float sunInPlaneLen = length(sunInPlane);
  cAzRef = (sunInPlaneLen > 1e-4)
    ? sunInPlane / sunInPlaneLen
    : normalize(cross(cUp, vec3(1.0, 0.0, 0.0)));
  cTangent = cross(cUp, cAzRef);  // right-handed
}

// Convert (azimuth, zenith) to a world-space view direction.
vec3 dirFromAzimuthZenith(float az, float zenith, vec3 cUp, vec3 cAzRef, vec3 cTangent) {
  float sinZ = sin(zenith);
  float cosZ = cos(zenith);
  return cosZ * cUp + sinZ * (cos(az) * cAzRef + sin(az) * cTangent);
}

// March along view ray, accumulate radiance.
vec3 marchAtmosphere(vec3 origin, vec3 dir, vec3 sunDir) {
  // Find the segment of the ray inside the atmosphere shell.
  float tEnter = raySphereNearest(origin, dir, uAtmosphereRadius);
  float tFar = raySphereFar(origin, dir, uAtmosphereRadius);
  if (tFar <= 0.0) return vec3(0.0);
  float tStart = max(tEnter, 0.0);
  // If the ray hits the planet, integrate up to the ground hit.
  float tGround = raySphereNearest(origin, dir, PLANET_RADIUS);
  float tEnd = (tGround > 0.0 && tGround > tStart) ? tGround : tFar;
  if (tEnd <= tStart) return vec3(0.0);

  float ds = (tEnd - tStart) / float(SKYVIEW_STEPS);
  vec3 inscattering = vec3(0.0);
  vec3 throughput = vec3(1.0);

  float cosTheta = dot(dir, sunDir);
  float pR = phaseRayleigh(cosTheta);
  float pM = phaseMie(cosTheta);

  for (int i = 0; i < SKYVIEW_STEPS; ++i) {
    float t = tStart + (float(i) + 0.5) * ds;
    vec3 p = origin + dir * t;
    float h = length(p);
    float altKm = max(0.0, h - PLANET_RADIUS) * kmPerUnit();

    vec3 ext = extinctionPerUnit(altKm, uRayleighScale, uMieScale);
    vec3 stepT = exp(-ext * ds);

    ScatteringPerUnit sc = scatteringPerUnit(altKm, uRayleighScale, uMieScale);

    // Sun visibility from sample point (transmittance LUT lookup).
    float muSun = dot(normalize(p), sunDir);
    vec3 sunT = sampleTransmittance(uTransmittance, h, muSun);

    // Multi-scatter ambient at this point.
    vec3 ms = sampleMultiScattering(uMultiScattering, h, muSun);

    vec3 single = (sc.rayleigh * pR + sc.mie * pM) * sunT * uSolarIrradiance;
    vec3 multi = (sc.rayleigh + sc.mie) * ms;
    vec3 stepIn = single + multi;
    vec3 segment = stepIn * (vec3(1.0) - stepT) / max(ext, vec3(1e-6));

    inscattering += throughput * segment;
    throughput *= stepT;
  }

  return inscattering;
}

void main() {
  float azimuth = vUv.x * 2.0 * PI;
  float zenith = vUv.y * PI;

  vec3 cUp, cAzRef, cTangent;
  cameraBasis(uCameraPos, uSunDirection, cUp, cAzRef, cTangent);

  vec3 dir = dirFromAzimuthZenith(azimuth, zenith, cUp, cAzRef, cTangent);
  vec3 L = marchAtmosphere(uCameraPos, dir, uSunDirection);
  fragColor = vec4(L, 1.0);
}
`,k0=200,B0=100;function z0(n,e,t={}){return new Zr({glslVersion:Vt,vertexShader:ca,fragmentShader:`${la}
${O0}`,uniforms:{uTransmittance:{value:n},uMultiScattering:{value:e},uCameraPos:{value:new L(3,0,0)},uSunDirection:{value:new L(1,0,.3).normalize()},uRayleighScale:{value:t.rayleighScale??1},uMieScale:{value:t.mieScale??1},uSolarIrradiance:{value:t.solarIrradiance?.clone()??new L(1.474,1.8504,1.91198)},uAtmosphereRadius:{value:t.atmosphereRadius??1.07}},depthTest:!1,depthWrite:!1})}class V0{constructor(e,t={}){this.renderer=e;const s=e.getContext().getExtension("EXT_color_buffer_float")!==null?$t:mn;this.rayleighScale=t.rayleighScale??1,this.mieScale=t.mieScale??1,this.atmosphereRadius=t.atmosphereRadius??1.07,this.transmittance=Ja(R0,D0,s,!1),this.multiScattering=Ja(U0,N0,s,!1),this.skyView=Ja(k0,B0,s,!0);const a=t.solarIrradiance;this.transmittanceMat=L0({rayleighScale:this.rayleighScale,mieScale:this.mieScale,atmosphereRadius:this.atmosphereRadius}),this.multiScatteringMat=F0(this.transmittance.texture,{rayleighScale:this.rayleighScale,mieScale:this.mieScale,atmosphereRadius:this.atmosphereRadius,...a?{solarIrradiance:a}:{}}),this.skyViewMat=z0(this.transmittance.texture,this.multiScattering.texture,{rayleighScale:this.rayleighScale,mieScale:this.mieScale,atmosphereRadius:this.atmosphereRadius,...a?{solarIrradiance:a}:{}}),this.quadGeom=new Zt,this.quadGeom.setAttribute("position",new St(new Float32Array([0,0,0,0,0,0,0,0,0]),3)),this.quadGeom.setDrawRange(0,3),this.quadMesh=new ut(this.quadGeom,this.transmittanceMat),this.quadMesh.frustumCulled=!1,this.quadScene=new xu,this.quadScene.add(this.quadMesh),this.quadCamera=new sa(-1,1,1,-1,0,1),this.precomputeTwoStaticLuts()}transmittance;multiScattering;skyView;transmittanceMat;multiScatteringMat;skyViewMat;quadGeom;quadMesh;quadScene;quadCamera;rayleighScale;mieScale;atmosphereRadius;precomputeTwoStaticLuts(){const e=this.renderer.getRenderTarget(),t=this.renderer.autoClear;this.renderer.autoClear=!0,this.quadMesh.material=this.transmittanceMat,this.renderer.setRenderTarget(this.transmittance),this.renderer.render(this.quadScene,this.quadCamera),this.quadMesh.material=this.multiScatteringMat,this.renderer.setRenderTarget(this.multiScattering),this.renderer.render(this.quadScene,this.quadCamera),this.renderer.setRenderTarget(e),this.renderer.autoClear=t}recompute(e,t){const i=this.skyViewMat.uniforms;i.uCameraPos.value.copy(e),i.uSunDirection.value.copy(t).normalize();const r=this.renderer.getRenderTarget(),s=this.renderer.autoClear;this.renderer.autoClear=!0,this.quadMesh.material=this.skyViewMat,this.renderer.setRenderTarget(this.skyView),this.renderer.render(this.quadScene,this.quadCamera),this.renderer.setRenderTarget(r),this.renderer.autoClear=s}recomputeAll(e,t,i){const r=i.atmosphereRadius!==this.atmosphereRadius;(i.rayleigh!==this.rayleighScale||i.mie!==this.mieScale||r)&&(this.rayleighScale=i.rayleigh,this.mieScale=i.mie,this.atmosphereRadius=i.atmosphereRadius,this.transmittanceMat.uniforms.uRayleighScale.value=i.rayleigh,this.transmittanceMat.uniforms.uMieScale.value=i.mie,this.transmittanceMat.uniforms.uAtmosphereRadius.value=i.atmosphereRadius,this.multiScatteringMat.uniforms.uRayleighScale.value=i.rayleigh,this.multiScatteringMat.uniforms.uMieScale.value=i.mie,this.multiScatteringMat.uniforms.uAtmosphereRadius.value=i.atmosphereRadius,this.skyViewMat.uniforms.uRayleighScale.value=i.rayleigh,this.skyViewMat.uniforms.uMieScale.value=i.mie,this.skyViewMat.uniforms.uAtmosphereRadius.value=i.atmosphereRadius,this.precomputeTwoStaticLuts()),this.recompute(e,t)}getAtmosphereRadius(){return this.atmosphereRadius}dispose(){this.transmittance.dispose(),this.multiScattering.dispose(),this.skyView.dispose(),this.transmittanceMat.dispose(),this.multiScatteringMat.dispose(),this.skyViewMat.dispose(),this.quadGeom.dispose()}}function Ja(n,e,t,i){const r=new bn(n,e,{type:t,format:Yt,colorSpace:Dn,minFilter:Tt,magFilter:Tt,wrapS:i?dr:_t,wrapT:_t,depthBuffer:!1,stencilBuffer:!1});return r.texture.generateMipmaps=!1,r}const H0=`// Runtime atmosphere fragment shader (GLSL3). Replaces the Phase 2 fresnel
// placeholder with a Hillaire 2020-style precomputed-LUT lookup + sun disk.
//
// The pass is a fullscreen triangle (see \`fullscreen.vert.glsl\`) added to
// the scene as a \`THREE.Mesh\` with \`depthTest=false\` and \`renderOrder=1\`,
// so it draws after the globe and alpha-composites over it. Alpha is 1
// where the line of sight passes only through atmosphere, fading to ~0 if
// the ray exits without hitting anything (deep space) — but we keep alpha
// slightly above 0 so the rim isn't crushed against the dark background.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uSkyView;
uniform sampler2D uTransmittance;
uniform vec3 uCameraPos;       // world-space, planet at origin
uniform vec3 uSunDirection;    // world-space, normalised
uniform mat4 uInvViewProj;     // inverse(projection * view)
uniform float uExposure;
uniform float uSunDiskAngle;   // radians (cos threshold derived in shader)
uniform vec3 uSolarIrradiance;

void cameraBasisRuntime(vec3 cam, vec3 sunDir, out vec3 cUp, out vec3 cAzRef, out vec3 cTangent) {
  cUp = normalize(cam);
  vec3 sunInPlane = sunDir - dot(sunDir, cUp) * cUp;
  float l = length(sunInPlane);
  cAzRef = (l > 1e-4)
    ? sunInPlane / l
    : normalize(cross(cUp, vec3(1.0, 0.0, 0.0)));
  cTangent = cross(cUp, cAzRef);
}

void main() {
  // Reconstruct world-space view ray from screen UV.
  vec4 ndcNear = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 ndcFar  = vec4(vUv * 2.0 - 1.0,  1.0, 1.0);
  vec4 wn = uInvViewProj * ndcNear;
  vec4 wf = uInvViewProj * ndcFar;
  vec3 worldNear = wn.xyz / wn.w;
  vec3 worldFar = wf.xyz / wf.w;
  vec3 dir = normalize(worldFar - worldNear);

  // Project view dir into camera-local (up, az-ref-toward-sun, tangent) frame.
  vec3 cUp, cAzRef, cTangent;
  cameraBasisRuntime(uCameraPos, uSunDirection, cUp, cAzRef, cTangent);

  float zenith = acos(clamp(dot(dir, cUp), -1.0, 1.0));
  float az = atan(dot(dir, cTangent), dot(dir, cAzRef));
  if (az < 0.0) az += 2.0 * PI;

  vec2 lutUv = vec2(az / (2.0 * PI), zenith / PI);
  vec3 sky = texture(uSkyView, lutUv).rgb;

  // Sun disk: visible if cosTheta with sun > cos(uSunDiskAngle), modulated by
  // transmittance from camera through atmosphere along the view ray.
  float cosTheta = dot(dir, uSunDirection);
  float cosDisk = cos(uSunDiskAngle);
  if (cosTheta > cosDisk) {
    float edge = smoothstep(cosDisk, cosDisk + 0.0008, cosTheta);
    // Transmittance from camera to sun along view ray. Approximate by
    // sampling LUT at camera altitude × view-zenith (μ = dot(dir, cUp)).
    float r = length(uCameraPos);
    // Camera is outside atmosphere; clamp h to atmosphere radius for LUT.
    float h = min(r, uAtmosphereRadius);
    float mu = clamp(dot(dir, cUp), -1.0, 1.0);
    vec3 T = sampleTransmittance(uTransmittance, h, mu);
    sky += edge * T * uSolarIrradiance;
  }

  // Apply exposure, output linear (postfx grade does final tonemap in M8).
  vec3 col = sky * uExposure;

  // Alpha: bright pixels (atmosphere rim, sun) fully opaque; dim pixels
  // (deep space behind the limb) transparent so the dark scene background
  // shows through. Use luminance as a proxy.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float alpha = clamp(lum * 1.5, 0.0, 1.0);

  fragColor = vec4(col, alpha);
}
`;class G0{mesh;material;luts;geometry;tmpInvViewProj=new $e;tmpCameraPos=new L;sunDir=new L(1,0,.3).normalize();cameraPos=new L(3,0,0);dirty=!0;constructor(e,t={}){const i=t.atmosphereRadius??1.07;this.luts=new V0(e,{rayleighScale:t.rayleighScale??1,mieScale:t.mieScale??1,atmosphereRadius:i,...t.solarIrradiance?{solarIrradiance:t.solarIrradiance}:{}});const r=t.sunDiskAngleDeg??.535;this.material=new Zr({glslVersion:Vt,vertexShader:ca,fragmentShader:`${la}
${H0}`,uniforms:{uSkyView:{value:this.luts.skyView.texture},uTransmittance:{value:this.luts.transmittance.texture},uCameraPos:{value:this.cameraPos.clone()},uSunDirection:{value:this.sunDir.clone()},uInvViewProj:{value:new $e},uExposure:{value:t.exposure??1},uSunDiskAngle:{value:r*Math.PI/180},uSolarIrradiance:{value:t.solarIrradiance?.clone()??new L(1.474,1.8504,1.91198)},uAtmosphereRadius:{value:i}},transparent:!0,depthTest:!1,depthWrite:!1,blending:yi}),this.geometry=new Zt,this.geometry.setAttribute("position",new St(new Float32Array(9),3)),this.geometry.setDrawRange(0,3),this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=1}setSunDirection(e){this.sunDir.copy(e).normalize(),this.material.uniforms.uSunDirection.value.copy(this.sunDir),this.dirty=!0}syncFromCamera(e){e.getWorldPosition(this.tmpCameraPos),this.tmpCameraPos.equals(this.cameraPos)||(this.cameraPos.copy(this.tmpCameraPos),this.dirty=!0),this.material.uniforms.uCameraPos.value.copy(this.cameraPos),this.tmpInvViewProj.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this.tmpInvViewProj.invert(),this.material.uniforms.uInvViewProj.value.copy(this.tmpInvViewProj),this.dirty&&(this.luts.recompute(this.cameraPos,this.sunDir),this.dirty=!1)}setScales(e,t,i){const r=i??this.luts.getAtmosphereRadius();this.material.uniforms.uAtmosphereRadius.value=r,this.luts.recomputeAll(this.cameraPos,this.sunDir,{rayleigh:e,mie:t,atmosphereRadius:r})}setExposure(e){this.material.uniforms.uExposure.value=e}setSunDiskAngleDeg(e){this.material.uniforms.uSunDiskAngle.value=e*Math.PI/180}dispose(){this.geometry.dispose(),this.material.dispose(),this.luts.dispose()}}const W0={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class ha{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const X0=new sa(-1,1,1,-1,0,1);class j0 extends Zt{constructor(){super(),this.setAttribute("position",new on([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new on([0,2,0,0,2,0],2))}}const K0=new j0;class q0{constructor(e){this._mesh=new ut(K0,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,X0)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Y0 extends ha{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof mt?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=hu.clone(e.uniforms),this.material=new mt({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new q0(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class oh extends ha{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){const r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class $0 extends ha{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class Z0{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const i=e.getSize(new ye);this._width=i.width,this._height=i.height,t=new bn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:$t}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Y0(W0),this.copyPass.material.blending=Fn,this.clock=new W_}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let i=!1;for(let r=0,s=this.passes.length;r<s;r++){const a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),a.needsSwap){if(i){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}oh!==void 0&&(a instanceof oh?i=!0:a instanceof $0&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new ye);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(i,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class J0 extends ha{constructor(e,t,i=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new we}render(e,t,i){const r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}}const Q0=4;class ex{constructor(e,t,i){this.renderer=e;const r=e.getSize(new ye),s=e.getPixelRatio(),a=new bn(Math.max(1,Math.floor(r.x*s)),Math.max(1,Math.floor(r.y*s)),{samples:Q0,type:$t});this.composer=new Z0(e,a),this.composer.setPixelRatio(e.getPixelRatio()),this.renderPass=new J0(t,i),this.composer.addPass(this.renderPass)}composer;renderPass;extraPasses=[];setSceneCamera(e,t){this.renderPass.scene=e,this.renderPass.camera=t}addPass(e){this.composer.addPass(e),this.extraPasses.push(e)}insertPass(e,t){this.composer.insertPass(e,t),this.extraPasses.push(e)}setSize(e,t){this.composer.setSize(e,t)}render(e){this.composer.render(e)}dispose(){for(const e of this.extraPasses)e.dispose?.();this.extraPasses=[],this.composer.dispose()}}const tx=`// Procedural noise helpers for the volumetric cloud pass.
//
// Concatenated ABOVE the cloud frag shader at material build time, so this
// chunk owns the global \`precision\` declarations. (\`RawShaderMaterial\` +
// GLSL3 supplies no implicit precision; the first float/vec3 declaration
// without one fails to compile.)

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;


//
// All sampled in 3D so the cloud field stays coherent across the spherical
// shell — sampling a 2D equirect noise in a 3D shell produces obvious
// "vertical pillars" that look fake on a planet. 3D coverage costs a
// little more per fetch but the result holds up at any zoom.
//
// Two layers compose the cloud density field:
//   * \`cn_fbm(p)\` — 4-octave value-noise FBM. Macro cloud cells, gentle
//     cumulus shapes. This drives coverage.
//   * \`cn_worley(p)\` — distance to the nearest 3D feature point, computed
//     over a 3×3×3 cell neighbourhood. Inverted (1 - d) gives sharper
//     internal billows that erode the FBM edges so cloud silhouettes
//     don't all look like soft blobs.
//
// Both use the same \`cn_hash13\` so jitter is deterministic per
// integer-grid cell. Frequencies in the cloud frag are tuned empirically
// against a 6371 km Earth — see comments in clouds.frag.glsl.

float cn_hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

vec3 cn_hash33(vec3 p) {
  return vec3(
    cn_hash13(p),
    cn_hash13(p + vec3(7.7, 11.3, 13.7)),
    cn_hash13(p + vec3(19.1, 23.9, 29.3))
  );
}

float cn_vnoise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = cn_hash13(p);
  float n100 = cn_hash13(p + vec3(1.0, 0.0, 0.0));
  float n010 = cn_hash13(p + vec3(0.0, 1.0, 0.0));
  float n110 = cn_hash13(p + vec3(1.0, 1.0, 0.0));
  float n001 = cn_hash13(p + vec3(0.0, 0.0, 1.0));
  float n101 = cn_hash13(p + vec3(1.0, 0.0, 1.0));
  float n011 = cn_hash13(p + vec3(0.0, 1.0, 1.0));
  float n111 = cn_hash13(p + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float cn_fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; ++i) {
    v += a * cn_vnoise3(p);
    p = p * 2.03 + vec3(0.71, 0.13, 0.49);
    a *= 0.5;
  }
  return v;
}

// FBM with caller-supplied per-octave weights. Same underlying grid as
// \`cn_fbm\` (same offsets per octave, same frequency doubling) so the
// noise pattern is spatially coherent across all weight choices.
// Modulating w smoothly across the surface produces clouds that visually
// morph between "low-frequency-dominant big rolling shapes" and "all-
// octaves-balanced small puffy texture" without tearing — the underlying
// noise samples don't change, only how they're combined.
float cn_fbm_weighted(vec3 p, vec4 w) {
  float v = 0.0;
  v += w.x * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.y * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.z * cn_vnoise3(p);
  p = p * 2.03 + vec3(0.71, 0.13, 0.49);
  v += w.w * cn_vnoise3(p);
  return v;
}

// 3D Worley — distance² to the nearest jittered feature point in the 27
// neighbour cells. Caller takes sqrt or maps as needed. Returns ~[0, 1].
float cn_worley(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  float minD2 = 1e9;
  for (int kz = -1; kz <= 1; ++kz) {
    for (int ky = -1; ky <= 1; ++ky) {
      for (int kx = -1; kx <= 1; ++kx) {
        vec3 cell = vec3(float(kx), float(ky), float(kz));
        vec3 jitter = cn_hash33(p + cell);
        vec3 d = cell + jitter - f;
        minD2 = min(minD2, dot(d, d));
      }
    }
  }
  return sqrt(minD2);
}
`,nx=`// Fullscreen-triangle vertex shader (GLSL3) for the volumetric cloud pass.
// Same convention as atmosphere/shaders/fullscreen.vert.glsl: a single
// triangle with clip-space coords (-1,-1), (3,-1), (-1,3); the viewport-
// clipped portion covers [0,1]² in UV. The fragment reconstructs a
// world-space view ray from \`vUv\` + \`uInvViewProj\`.

out vec2 vUv;

void main() {
  vec2 clip = vec2(
    (gl_VertexID == 1) ?  3.0 : -1.0,
    (gl_VertexID == 2) ?  3.0 : -1.0
  );
  vUv = 0.5 * (clip + 1.0);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`,ix=`// Volumetric cloud raymarch (M5).
//
// Drawn as a fullscreen triangle in the scene with \`transparent = true\`,
// \`depthTest = false\`, \`depthWrite = false\`, \`renderOrder = 0\` — so it
// composites *after* the opaque globe (which has written depth) and
// *before* the atmosphere (renderOrder = 1) which adds the rim glow on
// top. Premultiplied alpha output: the front-to-back integration already
// folds opacity into RGB.
//
// Domain: spherical shell \`[cloudInner(), cloudOuter()]\` — base at
// CLOUD_BASE_M (3000 m), top at CLOUD_TOP_M (4000 m), both expressed in
// the same metres-→-unit-sphere scale (\`uElevationScale\`) the land/water
// vertex shaders use. The cloud floor lines up with the mountain-mask
// cutoff in \`coverAt\` so peaks above 3000 m are above the cloud layer.
// Density is procedural 3D noise; advection is a per-fragment lat/lon
// shift sampled from the pre-baked wind field.
//
// Algorithm (per fragment):
//   1. Reconstruct world-space view ray from \`vUv\` + \`uInvViewProj\`.
//   2. Intersect ray with planet, inner shell, outer shell.
//   3. Choose \`[t0, t1]\` = front segment of the cloud shell, clipped to
//      the planet hit if any. Discard if empty.
//   4. Front-to-back raymarch with a hash-jittered start to break
//      banding. ~16 steps usually; transmittance early-out at 0.01.
//   5. Per active sample: short light march toward the sun, Henyey-
//      Greenstein phase, Beer-Lambert absorption, day/night wrap.
//
// The pass requires the wind field bound to \`uWindField\`. If the bake
// shipped a placeholder, the runtime keeps the layer toggle off — see
// \`scene-graph.ts\`.

precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uWindField;       // RG16F equirect, m/s (u, v).
uniform vec3 uCameraPos;
uniform vec3 uSunDirection;
uniform mat4 uInvViewProj;
uniform float uTime;

uniform float uDensity;             // overall density scale (Tweakpane)
uniform float uCoverage;            // FBM threshold — higher = more sky covered
uniform float uBeer;                // Beer-Lambert extinction strength
uniform float uHenyey;              // Henyey-Greenstein g parameter
uniform float uAdvection;           // wind-shift multiplier

// Same metres → unit-sphere displacement scale used by Land/Water vertex
// shaders. Drives the cloud shell altitude so the cloud base sits at
// exactly CLOUD_BASE_M above the rendered sea-level radius.
uniform float uElevationScale;

// Geo data — biome class + climate + elevation. Sampled per HEALPix cell
// via \`coverAt()\` and blurred (19-tap hex) inside \`sampleCoverMul\`. The
// blur produces a smooth scalar [0, 1] that ONLY multiplies the final
// cloud density — the noise field that defines cloud SHAPES is globally
// uniform and ignores biome data entirely. Elevation is read inside
// \`coverAt\` to fade cover above peaks (geometry choice — the cloud shell
// sits at 1500–2500 m, so high terrain pokes through and shouldn't carry
// cloud cover); horizontal terrain response (wind curving around ranges,
// piling up on windward sides) comes from the wind data itself.
uniform highp usampler2D uIdRaster;
uniform sampler2D uAttrStatic;     // RGBA8: elevClass / biomeClass / soilClass / urbanization
uniform sampler2D uAttrClimate;    // RG16F: temperature_c / moisture_frac
uniform sampler2D uElevationMeters; // R16F: continuous elevation in metres (read in coverAt)
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

const float PI = 3.14159265359;
const float PLANET_R = 1.0;

// Cloud shell altitude in metres above sea level. Base is at exactly
// CLOUD_BASE_M so the mountain-mask cutoff (also 3000 m, in \`coverAt\`)
// lines up with the cloud floor — peaks above 3000 m clear out from
// the cover map AND physically poke through the cloud base, no
// overlap, no funky intersection. Top is 1 km higher; cloud raymarch
// has room for volumetric depth.
const float CLOUD_BASE_M = 1500.0;
const float CLOUD_TOP_M  = 2500.0;

const int RAY_STEPS = 16;
const int LIGHT_STEPS = 4;

// Cloud shell radii in unit-sphere units. These cannot be GLSL \`const\`
// because they depend on \`uElevationScale\` (a uniform), but the compiler
// inlines and constant-folds the uniform per draw, so call cost is zero.
float cloudInner() { return PLANET_R + CLOUD_BASE_M * uElevationScale; }
float cloudOuter() { return PLANET_R + CLOUD_TOP_M * uElevationScale; }
float shellThick() { return (CLOUD_TOP_M - CLOUD_BASE_M) * uElevationScale; }

// Extinction-coefficient scale. \`cloudDensity\` returns a normalised
// density in roughly [0, 1]; the raymarch consumes it as
// optical_depth = density * dt * uBeer * EXTINCTION_VIEW. Without this
// scale, dt is in unit-radius (≈ 6371 km per unit) and the per-step
// absorption is negligible — clouds would barely register at any
// \`uBeer\` the slider can push. 2000 puts a peak-density step at
// alpha ≈ 0.5 with default Tweakpane values, so out-of-the-box clouds
// read as solid silhouettes against the sky.
//
// Light march uses a smaller multiplier so even peak-density clouds
// retain some directly-lit brightness instead of going fully black —
// cheap proxy for the powder/multi-scattering term that real cloud
// renderers use.
const float EXTINCTION_VIEW = 2000.0;
const float EXTINCTION_LIGHT = 500.0;

// Wind is m/s. One radian on the unit sphere = ~6371 km. So at altitude
// ~6385 km, 1 m/s integrates to (1 / 6.385e6) rad/s ≈ 1.566e-7 rad/s.
// The Tweakpane \`advection\` multiplier scales this. Without the user
// dialing it up, real wind speeds (~10 m/s typical, ~100 m/s jet stream)
// move the pattern visibly over a minute or two of real time.
const float WIND_M_PER_S_TO_RAD_PER_S = 1.566e-7;

// Slow morph through the 3D noise volume — gives clouds a "lifetime"
// independent of wind drift. Without this, the noise field is purely
// spatial: blobs slide forever along streamlines but never bloom or
// dissolve. With this, every fragment slowly walks through a different
// slice of the same noise volume, so coverage at any fixed point flips
// between "below threshold" (clear sky) and "above threshold" (cloud)
// over time. Constant axis is irrational-ish so the walk doesn't lock
// onto a periodic orbit.
//
// Rate: 3.0e-4 per uTime unit. With CLOUD_TIME_SCALE=400 driving uTime
// at 400/sec of wall-clock, that's ~0.12 noise-units/sec → one full
// noise wavelength every ~8.5 sec real time. Doubled from the original
// 1.5e-4 to halve cloud lifetime — clouds bloom and dissolve faster so
// the global pattern doesn't read as one huge static streak.
const float MORPH_RATE = 3.0e-4;
const vec3 MORPH_AXIS = vec3(0.71, 0.39, 1.13);

// Ray-sphere helpers. Mirrors atmosphere/common.glsl's pair so we don't
// need to pull the whole atmosphere preamble into this shader.
float rayShellNearest(vec3 ro, vec3 dir, float radius) {
  float b = dot(ro, dir);
  float c = dot(ro, ro) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  float sq = sqrt(disc);
  float t0 = -b - sq;
  float t1 = -b + sq;
  if (t0 >= 0.0) return t0;
  if (t1 >= 0.0) return t1;
  return -1.0;
}

float rayShellFar(vec3 ro, vec3 dir, float radius) {
  float b = dot(ro, dir);
  float c = dot(ro, ro) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  return -b + sqrt(disc);
}

vec2 sampleWindLatLon(vec3 dir) {
  float lat = asin(clamp(dir.z, -1.0, 1.0));
  float lon = atan(dir.y, dir.x);
  // Equirect: u maps lon ∈ (-π, π] → (0, 1]; v maps lat ∈ [-π/2, π/2] → [1, 0]
  // (textures with origin at top-left: top row = +90°N).
  vec2 uv = vec2((lon + PI) / (2.0 * PI), 0.5 - lat / PI);
  return texture(uWindField, uv).rg;
}

// Sample cloud density at world position \`p\`. Returns ~[0, 1] scaled by
// \`uDensity\` so a value of 1 means "fully opaque per unit-radius step."
//
// CRITICAL DESIGN RULE: the noise field — octave weights, wind rate,
// coverage threshold, sample positions — is GLOBALLY IDENTICAL at every
// pixel on the planet. Biome data does NOT enter any of those. It only
// multiplies the FINAL density at the end as an opacity scaler.
//
// Why: any per-pixel variation in the noise field's structure (different
// octave weights, different sampling positions, different threshold)
// makes adjacent pixels read different noise functions. Even with a
// heavy input blur on biome data, the noise itself becomes spatially
// incoherent and tears wherever the biome gradient is non-zero —
// visible as bright continent-outline ridges. End-of-pipeline
// multiplication keeps the cloud shapes coherent across the planet and
// only fades their visibility per region.
float cloudDensity(vec3 p, float coverMul) {
  float r = length(p);

  // Vertical fade — density peaks in the middle of the shell, tapers to
  // zero at top + bottom so the silhouette doesn't read as a hard cube.
  float h = (r - cloudInner()) / shellThick();
  if (h < 0.0 || h > 1.0) return 0.0;
  float vFade = smoothstep(0.0, 0.18, h) * smoothstep(1.0, 0.75, h);
  if (vFade <= 0.0) return 0.0;

  vec3 dir = p / r;

  // Wind advection — globally uniform rate. No biome multiplier here:
  // varying the rate per pixel would shift the noise sampling position
  // differently for adjacent pixels and tear the field at the boundary.
  // Real NCEP/NCAR sigma-995 surface wind already encodes terrain
  // response (continental friction, deflection around ranges, monsoon
  // shifts) so no procedural mountain-deflection workaround is needed.
  vec2 wind = sampleWindLatLon(dir);

  float shift = WIND_M_PER_S_TO_RAD_PER_S * uTime * uAdvection;
  vec3 up = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 east = normalize(cross(up, dir));
  vec3 north = cross(dir, east);
  vec3 dShift = dir + east * (wind.x * shift) + north * (wind.y * shift);
  vec3 advDir = normalize(dShift);

  // Single FBM with FIXED octave weights — same noise function at every
  // pixel. No biome dependence here.
  vec3 morph = MORPH_AXIS * (uTime * MORPH_RATE);
  const vec4 OCTAVE_W = vec4(0.40, 0.30, 0.20, 0.10);
  float n = cn_fbm_weighted(advDir * 8.0 + morph, OCTAVE_W);

  // Coverage threshold — globally uniform. Same Tweakpane control,
  // same value everywhere on the planet.
  float thresh = 1.0 - uCoverage;
  float baseSlab = smoothstep(thresh, 1.0, n);
  if (baseSlab <= 0.0) return 0.0;

  // Erosion: 3D Worley carves billows / chunkiness inside the slabs.
  float wd = cn_worley(advDir * 8.0 + vec3(3.7, 1.3, 5.1) + morph);
  float erosion = clamp(1.0 - wd, 0.0, 1.0);

  float density = baseSlab * (0.45 + 0.55 * erosion);

  // Biome-driven cover modifier — the ONLY place biome enters. Multiplies
  // the cloud's final opacity. Smooth \`coverMul\` → smooth visibility
  // gradient, even where the underlying biome class changes sharply
  // from one HEALPix cell to the next.
  return density * vFade * coverMul * uDensity;
}

float henyeyGreenstein(float cosTheta, float g) {
  float g2 = g * g;
  float denom = pow(max(0.0, 1.0 + g2 - 2.0 * g * cosTheta), 1.5);
  return (1.0 - g2) / max(denom, 1e-4) / (4.0 * PI);
}

// Per-cell biome → cover. One HEALPix lookup, returns a SCALAR cover
// multiplier in [0, 1] for THIS cell.
//
//   ocean (warm/cold)  → 1.0   (ITCZ + storm tracks fully cloudy)
//   forest / wetland   → 0.9   (humid convection, but slightly less than ocean)
//   moss / tundra      → 0.7
//   ice                → 0.5   (broad polar fronts, but thin)
//   default land       → smoothstep on moistureFrac (real precipitation cut)
//   desert             → 0.1   (Hadley descent, near-cloudless)
//
// Mountain boundary: cells above 2500 m elevation get their cover faded
// to zero (full suppression by 3000 m). High peaks act as a hard ceiling
// for cloud formation — visually creates clean cloud-free zones over
// alpine/Himalayan/Andean regions. The 19-tap blur softens the boundary
// further so the suppression doesn't read as a hard outline.
//
// Biome codes (from \`attrs.yaml\`, encoded into G channel × 255):
//   1=tree-cover  6=bare/desert  7=snow/ice  8=water (ocean)
//   9=wetland     10=mangroves   11=moss/tundra
//
// Returns a per-cell discrete value. Callers MUST blur (see
// \`sampleCoverMul\`) so that adjacent cells across a coastline don't
// stamp a hard step into the cloud's output opacity.
float coverAt(vec3 dir) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, dir.z, atan(dir.y, dir.x));
  ivec2 tx = healpixIpixToTexel(ipix, uAttrTexWidth);
  float biomeF = texelFetch(uAttrStatic, tx, 0).g * 255.0;
  vec2 climate = texelFetch(uAttrClimate, tx, 0).rg;
  float moistureFrac = climate.g;
  float elevM = texelFetch(uElevationMeters, tx, 0).r;

  float isOcean   = step(7.5, biomeF) * step(biomeF, 8.5);
  float isDesert  = step(5.5, biomeF) * step(biomeF, 6.5);
  float isForest  = step(0.5, biomeF) * step(biomeF, 1.5);
  float isWetland = step(8.5, biomeF) * step(biomeF, 10.5);
  float isIce     = step(6.5, biomeF) * step(biomeF, 7.5);
  float isTundra  = step(10.5, biomeF) * step(biomeF, 11.5);

  // Default land: precipitation-driven cover.
  float landCover = smoothstep(0.05, 0.35, moistureFrac);

  // Each \`is*\` flag (mutually exclusive) overrides the default land cover.
  float cover = landCover;
  cover = mix(cover, 0.10, isDesert);
  cover = mix(cover, 0.90, isForest);
  cover = mix(cover, 0.90, isWetland);
  cover = mix(cover, 0.50, isIce);
  cover = mix(cover, 0.70, isTundra);
  cover = mix(cover, 1.00, isOcean);

  // Mountain boundary: peaks above 2500 m suppress cloud formation,
  // fully cloud-free above 3000 m. The 500-m soft band keeps the edge
  // from looking stamped; the 19-tap blur outside softens it further.
  float mountainMask = 1.0 - smoothstep(2500.0, 3000.0, elevM);
  cover *= mountainMask;

  return cover;
}

// 19-tap hex blur of biome-driven cover. Centre + 6-tap inner ring (R) +
// 12-tap outer ring (2R). Inner R ≈ 0.012 rad ≈ 76 km (~6 HEALPix cells
// at nside=1024); kernel diameter ~300 km. Smooths per-cell biome
// transitions so coastlines and biome boundaries don't stamp hard steps
// into cloud opacity.
float sampleCoverMul(vec3 dir) {
  vec3 up = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 east = normalize(cross(up, dir));
  vec3 north = cross(dir, east);

  const float R = 0.012;
  float cSum = coverAt(dir);

  for (int i = 0; i < 6; ++i) {
    float a = float(i) * 1.0471975512;  // π/3
    vec3 d = normalize(dir + east * (cos(a) * R) + north * (sin(a) * R));
    cSum += coverAt(d);
  }

  for (int i = 0; i < 12; ++i) {
    float a = float(i) * 0.5235987756;  // π/6
    vec3 d = normalize(dir + east * (cos(a) * 2.0 * R) + north * (sin(a) * 2.0 * R));
    cSum += coverAt(d);
  }

  return cSum * (1.0 / 19.0);
}

void main() {
  // Reconstruct world-space view ray from screen UV.
  vec4 ndcNear = vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec4 ndcFar  = vec4(vUv * 2.0 - 1.0,  1.0, 1.0);
  vec4 wn = uInvViewProj * ndcNear;
  vec4 wf = uInvViewProj * ndcFar;
  vec3 worldNear = wn.xyz / wn.w;
  vec3 worldFar  = wf.xyz / wf.w;
  vec3 dir = normalize(worldFar - worldNear);

  vec3 ro = uCameraPos;

  // Ray vs cloud shell + planet. Camera sits at radius ~3 (well outside
  // the shell), so \`tOuterNear\` is the ray's first contact with the
  // shell from outside. \`tInnerNear\` is positive iff the ray plunges
  // into the cap that contains the planet.
  float rOuter = cloudOuter();
  float rInner = cloudInner();
  float tOuterNear = rayShellNearest(ro, dir, rOuter);
  float tOuterFar  = rayShellFar(ro, dir, rOuter);
  if (tOuterNear < 0.0 && tOuterFar < 0.0) discard;

  float tInnerNear = rayShellNearest(ro, dir, rInner);
  float tPlanet    = rayShellNearest(ro, dir, PLANET_R);

  float t0 = max(tOuterNear, 0.0);
  // Exit at the inner shell if we hit it (front lobe only — the back
  // lobe behind the planet is hidden by the globe's depth anyway), else
  // at the outer shell's far side.
  float t1 = (tInnerNear > 0.0) ? tInnerNear : tOuterFar;
  // Planet clip: never march past the surface.
  if (tPlanet > 0.0) t1 = min(t1, tPlanet);

  if (t1 <= t0) discard;

  // Cap segment so a near-miss grazing ray doesn't blow up step count.
  float thick = shellThick();
  float segLen = min(t1 - t0, 4.0 * thick);
  float dt = segLen / float(RAY_STEPS);

  // Surface-driven cover multiplier, sampled ONCE at the surface point
  // beneath the segment midpoint. Applies to every march step + every
  // light-march step in this fragment. 19-tap hex blur over biome cover.
  vec3 segMid = ro + dir * (0.5 * (t0 + t1));
  vec3 segDir = normalize(segMid);
  float coverMul = sampleCoverMul(segDir);

  // Hash-jitter the start so undersampled steps spread their banding.
  // gl_FragCoord is in pixels; combining with uTime gives temporal
  // dither too without needing a blue-noise texture.
  float jitter = cn_hash13(vec3(gl_FragCoord.xy, uTime * 0.37));
  float t = t0 + jitter * dt;

  vec3 sunDir = normalize(uSunDirection);
  float cosTheta = dot(dir, sunDir);
  float phase = henyeyGreenstein(cosTheta, uHenyey);

  vec3 sunColor = vec3(1.00, 0.96, 0.88);
  vec3 ambientColor = vec3(0.55, 0.65, 0.80);

  vec3 col = vec3(0.0);
  float transmittance = 1.0;

  for (int i = 0; i < RAY_STEPS; ++i) {
    if (transmittance < 0.01) break;

    vec3 p = ro + dir * t;
    float d = cloudDensity(p, coverMul);
    if (d > 0.001) {
      // Light march — a few exponentially-spaced samples toward the
      // sun. Cheap proxy for "how much sun reaches this voxel."
      float lightOptical = 0.0;
      float ls = thick * 0.05;
      vec3 lp = p;
      for (int j = 0; j < LIGHT_STEPS; ++j) {
        lp += sunDir * ls;
        lightOptical += cloudDensity(lp, coverMul) * ls;
        ls *= 1.6;
      }
      float lightTransmit = exp(-lightOptical * uBeer * EXTINCTION_LIGHT);

      // Day/night wrap on the cloud sample's own normal — the part of
      // the shell facing away from the sun should darken regardless of
      // how thick the cloud is locally.
      vec3 nP = normalize(p);
      float wrap = smoothstep(-0.25, 0.55, dot(nP, sunDir));

      // In-scattering: directly-lit term + ambient sky tint.
      vec3 inscatter = sunColor * lightTransmit * phase * 4.0 * PI * mix(0.05, 1.0, wrap);
      inscatter += ambientColor * mix(0.20, 0.80, wrap);

      // Front-to-back integration. Beer extinction across this step,
      // then accumulate emitted/scattered light premultiplied by the
      // remaining transmittance.
      float absorb = exp(-d * dt * uBeer * EXTINCTION_VIEW);
      col += transmittance * (1.0 - absorb) * inscatter;
      transmittance *= absorb;
    }

    t += dt;
  }

  float alpha = clamp(1.0 - transmittance, 0.0, 1.0);
  if (alpha <= 0.0) discard;
  fragColor = vec4(col, alpha);
}
`,rx=.1,sx=.5,ax=1.4,ox=.4,lx=14,cx=400,hx=1e4;class ux{mesh;material;geometry;tmpInvViewProj=new $e;tmpCameraPos=new L;hasWindField=!1;constructor(e){const t=e.getWindFieldTexture();this.hasWindField=t!==null;const{nside:i,ordering:r}=e.getHealpixSpec();this.material=new Zr({glslVersion:Vt,vertexShader:nx,fragmentShader:`${tx}
${Mi}
${ix}`,uniforms:{uWindField:{value:t},uCameraPos:{value:new L},uSunDirection:{value:new L(1,0,.3).normalize()},uInvViewProj:{value:new $e},uTime:{value:hx},uDensity:{value:rx},uCoverage:{value:sx},uBeer:{value:ax},uHenyey:{value:ox},uAdvection:{value:lx},uIdRaster:{value:e.getIdRaster()},uAttrStatic:{value:e.getAttributeTexture("elevation")},uAttrClimate:{value:e.getAttributeTexture("temperature")},uElevationMeters:{value:e.getElevationMetersTexture()},uHealpixNside:{value:i},uHealpixOrdering:{value:r==="ring"?0:1},uAttrTexWidth:{value:4*i},uElevationScale:{value:Ri}},transparent:!0,depthTest:!1,depthWrite:!1,blending:Gh,blendSrc:ho,blendDst:Br,blendSrcAlpha:ho,blendDstAlpha:Br}),this.geometry=new Zt,this.geometry.setAttribute("position",new St(new Float32Array(9),3)),this.geometry.setDrawRange(0,3),this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=0,this.mesh.visible=!1}setSunDirection(e){this.material.uniforms.uSunDirection.value.copy(e).normalize()}setActive(e){this.mesh.visible=e&&this.hasWindField}setDensity(e){this.material.uniforms.uDensity.value=e}setCoverage(e){this.material.uniforms.uCoverage.value=e}setBeer(e){this.material.uniforms.uBeer.value=e}setHenyey(e){this.material.uniforms.uHenyey.value=e}setAdvection(e){this.material.uniforms.uAdvection.value=e}setElevationScale(e){this.material.uniforms.uElevationScale.value=e}syncFromCamera(e){e.getWorldPosition(this.tmpCameraPos),this.material.uniforms.uCameraPos.value.copy(this.tmpCameraPos),this.tmpInvViewProj.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this.tmpInvViewProj.invert(),this.material.uniforms.uInvViewProj.value.copy(this.tmpInvViewProj)}update(e){this.material.uniforms.uTime.value+=e*cx}dispose(){this.geometry.dispose(),this.material.dispose()}}const dx=`// Cities vertex shader.
//
// Each instance is a quad sized as a fixed envelope (uMaxRadiusKm × 2.2,
// scaled into world units by uHalfQuadSizeUnit) anchored tangent to the
// globe at the city's lat/lon. The fragment shader paints the visible
// city as a sub-region of that envelope, masked by population radius and
// coastline.
//
// Radial lift: the land mesh displaces vertices outward by
// \`max(elevM, 0) * uElevationScale\`. Without matching that lift here,
// inland cities sit at unit radius while the land surface is above
// them, and the depth test silently buries them. We sample the same
// elevation field with the same 9-tap blur and coast-fade taper the
// land vertex shader uses, then add a small \`uCityRadialBias\` so the
// quad clears the land surface unambiguously.
//
// The healpix.glsl helper is concatenated before this source by
// CitiesLayer (Three.js ShaderMaterial doesn't process #include).
//
// Per-instance attributes:
//   aPopulation   — POP_MAX from Natural Earth (Float32)
//   aLatLon       — (lat°, lon°) — used to compute the surface normal
//                   precisely (instanceMatrix's translation column also
//                   carries it implicitly, but recomputing from lat/lon
//                   keeps numerical agreement with the HEALPix lookup
//                   the fragment shader uses for coastline masking)
//   aPatternSeed  — stable hash of (lat, lon) so each city has its own
//                   block pattern that doesn't change frame-to-frame

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

uniform float uHalfQuadSizeUnit;

uniform sampler2D uElevationMeters;
uniform highp usampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;
uniform float uElevationScale;
uniform float uCityRadialBias;

in float aPopulation;
in vec2 aLatLon;
in float aPatternSeed;

out vec2 vQuadUV;
out vec3 vSurfaceNormal;
out vec3 vWorldPos;
out float vPopulation;
out float vPatternSeed;

const float DEG = 0.017453292519943295;

ivec2 cellTexel(vec3 d) {
  int ipix = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, d.z, atan(d.y, d.x));
  return healpixIpixToTexel(ipix, uAttrTexWidth);
}

void main() {
  vQuadUV = uv;
  vPopulation = aPopulation;
  vPatternSeed = aPatternSeed;

  float lat = aLatLon.x * DEG;
  float lon = aLatLon.y * DEG;
  float cosLat = cos(lat);
  vec3 centre = vec3(cosLat * cos(lon), cosLat * sin(lon), sin(lat));
  vSurfaceNormal = normalize(centre);

  // 9-tap elevation blur (mirrors land.vert.glsl). eps ≈ 3 HEALPix cells
  // at nside=1024.
  vec3 dir = vSurfaceNormal;
  vec3 axisUp = abs(dir.z) < 0.99 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(axisUp, dir));
  vec3 t2 = cross(dir, t1);
  const float eps = 3.0e-3;
  const float diag = 0.7071;

  vec3 d0 = dir;
  vec3 d1 = normalize(dir + t1 * eps);
  vec3 d2 = normalize(dir - t1 * eps);
  vec3 d3 = normalize(dir + t2 * eps);
  vec3 d4 = normalize(dir - t2 * eps);
  vec3 d5 = normalize(dir + (t1 + t2) * eps * diag);
  vec3 d6 = normalize(dir + (t1 - t2) * eps * diag);
  vec3 d7 = normalize(dir - (t1 - t2) * eps * diag);
  vec3 d8 = normalize(dir - (t1 + t2) * eps * diag);

  ivec2 tx0 = cellTexel(d0);
  ivec2 tx1 = cellTexel(d1);
  ivec2 tx2 = cellTexel(d2);
  ivec2 tx3 = cellTexel(d3);
  ivec2 tx4 = cellTexel(d4);
  ivec2 tx5 = cellTexel(d5);
  ivec2 tx6 = cellTexel(d6);
  ivec2 tx7 = cellTexel(d7);
  ivec2 tx8 = cellTexel(d8);

  float elev = (
    texelFetch(uElevationMeters, tx0, 0).r +
    texelFetch(uElevationMeters, tx1, 0).r +
    texelFetch(uElevationMeters, tx2, 0).r +
    texelFetch(uElevationMeters, tx3, 0).r +
    texelFetch(uElevationMeters, tx4, 0).r +
    texelFetch(uElevationMeters, tx5, 0).r +
    texelFetch(uElevationMeters, tx6, 0).r +
    texelFetch(uElevationMeters, tx7, 0).r +
    texelFetch(uElevationMeters, tx8, 0).r
  ) / 9.0;

  int oceanCount = 0;
  if (texelFetch(uIdRaster, tx1, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx2, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx3, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx4, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx5, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx6, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx7, 0).r == 0u) oceanCount++;
  if (texelFetch(uIdRaster, tx8, 0).r == 0u) oceanCount++;
  float coastFade = 1.0 - float(oceanCount) / 8.0;
  coastFade *= coastFade;

  float landDisplace = max(elev, 0.0) * uElevationScale * coastFade;
  float radial = 1.0 + landDisplace + uCityRadialBias;

  vec3 worldUp = abs(vSurfaceNormal.z) < 0.99 ? vec3(0.0, 0.0, 1.0)
                                              : vec3(1.0, 0.0, 0.0);
  vec3 tangentX = normalize(cross(worldUp, vSurfaceNormal));
  vec3 tangentY = cross(vSurfaceNormal, tangentX);

  vec3 liftedCentre = centre * radial;
  vec2 local = (uv - 0.5) * 2.0 * uHalfQuadSizeUnit;
  vec3 worldPos = liftedCentre + tangentX * local.x + tangentY * local.y;
  vWorldPos = worldPos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`,px=`// Cities fragment shader.
//
// Paints an organic spray of rectangular building blocks per city:
// dense, opaque, thick-outlined downtown -> sparse, faint, thin-outlined
// suburbs that fade to nothing. Hard-clips at coastlines via the same
// HEALPix id raster Land/Clouds use, so coastal cities wrap around their
// shoreline (crescent / fan shapes) without ever painting onto water.
//
// Day/night blend mirrors land.frag.glsl:304-314 — smoothstep over
// dot(surfaceNormal, sunDir), mix between a grey building palette and a
// warm tungsten night palette. The PostFX bloom pass picks up the bright
// night pixels naturally.
//
// The shader composes the healpix.glsl chunk (Land + Clouds do the same)
// for \`healpixZPhiToPix\` / \`healpixIpixToTexel\`. Concatenation happens
// in CitiesMaterial.ts, NOT via #include (Three.js ShaderMaterial doesn't
// process GLSL #include).

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;

in vec2 vQuadUV;
in vec3 vSurfaceNormal;
in vec3 vWorldPos;
in float vPopulation;
in float vPatternSeed;

uniform vec3 uSunDirection;

uniform highp usampler2D uIdRaster;
uniform int uHealpixNside;
uniform int uHealpixOrdering;
uniform int uAttrTexWidth;

// World-unit conversions: globe radius = 1.0 unit, 1 km = (1 / EARTH_KM)
// units. Passed in so the layer can rescale if the globe grows.
uniform float uMaxRadiusKm;     // matches the quad envelope size
uniform float uBaseRadiusKm;    // sqrt(pop / 1e6) * baseRadius
uniform float uMinRadiusKm;
uniform float uMinPopulation;   // hide cities below this

uniform float uFalloffStrength; // suburb thinning aggressiveness (1..6)
uniform float uGridDensity;     // block count per radius (4..20)
uniform float uBlockThreshold;  // higher = sparser suburbs (0..0.6)
uniform float uOutlineMin;      // suburb outline thinness
uniform float uOutlineMax;      // downtown outline thickness
uniform float uNightBrightness;
uniform float uDayContrast;
uniform float uOpacity;         // overall layer opacity multiplier

out vec4 fragColor;

// Stable hash — same family as the popular GPU hash. Maps a vec2 to
// roughly-uniform [0,1]. Cheap and visually adequate; we don't need
// cryptographic-quality randomness.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  // Quad-local coordinates in [-1, +1].
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float r = length(local);
  // Distance from the city centre, in km.
  float r_km = r * uMaxRadiusKm;

  // Per-city visible radius — population drives size.
  float visibleRadius_km =
      clamp(sqrt(max(vPopulation, 1.0) / 1.0e6) * uBaseRadiusKm, uMinRadiusKm, uMaxRadiusKm);
  float r_norm = r_km / max(visibleRadius_km, 1.0);  // 0 = centre, 1 = edge of city

  // Hard outer cutoff so blocks never appear outside the visible radius.
  if (r_norm > 1.05) discard;

  // Population gate.
  if (vPopulation < uMinPopulation) discard;

  // Organic radial density envelope: gaussian falloff. Centre dense,
  // suburbs sparse.
  float density = exp(-r_norm * r_norm * uFalloffStrength);

  // Two-octave block grid. Coarse cells = "city blocks"; fine cells =
  // "buildings". Each city's pattern is keyed by \`vPatternSeed\` so
  // patterns don't tile across cities.
  vec2 cellCoord = local * uGridDensity;
  vec2 cellId = floor(cellCoord);
  vec2 cellLocal = fract(cellCoord);

  // Per-cell randomness.
  float h = hash21(cellId + vec2(vPatternSeed, vPatternSeed * 1.7));
  float h2 = hash11(h * 91.7);

  // Block existence: at the centre \`density ≈ 1\`, threshold passes for
  // most cells. As \`density → 0\`, fewer and fewer cells render —
  // suburbs naturally thin out.
  float blockExists = step(uBlockThreshold + (1.0 - density), h);

  // Random per-block inset so block sizes vary (a little). Inset shrinks
  // toward the edges so suburbs feel "looser".
  float inset = mix(0.05, 0.18, h2) * (0.4 + 0.6 * density);
  float dx = min(cellLocal.x, 1.0 - cellLocal.x);
  float dy = min(cellLocal.y, 1.0 - cellLocal.y);
  float edgeDist = min(dx, dy);
  float fill = step(inset, edgeDist) * blockExists;

  // Outlines: thicker at the centre, hairline in the suburbs. The outline
  // sits just outside the inset filled region.
  float outlineWidth = mix(uOutlineMin, uOutlineMax, density);
  float outline = (1.0 - smoothstep(inset, inset + outlineWidth, edgeDist))
                  * step(edgeDist, inset)
                  * blockExists;

  // Block brightness — varies per cell so downtown isn't a uniform tone.
  float blockBright = mix(0.55, 1.0, h2);

  // Coastline mask: sample the HEALPix id raster at this fragment.
  // bodyId == 0 → ocean → fully transparent. The healpix chunk is
  // concatenated into the same shader source.
  vec3 sphereDir = normalize(vWorldPos);
  float phi = atan(sphereDir.y, sphereDir.x);
  int ipx = healpixZPhiToPix(uHealpixNside, uHealpixOrdering, sphereDir.z, phi);
  ivec2 tx = healpixIpixToTexel(ipx, uAttrTexWidth);
  uint bodyId = texelFetch(uIdRaster, tx, 0).r;
  float landMask = (bodyId == 0u) ? 0.0 : 1.0;

  // Day palette — dark grey buildings on dark grey streets, like a
  // satellite image of an urban grid. Inverted contrast vs. the biome
  // land underneath so the city pops against green / tan terrain.
  float dayFill = mix(0.20, 0.35, blockBright);
  float dayOutline = 0.14;
  vec3 dayCol = vec3(mix(dayFill, dayOutline, outline));
  // Slight contrast knob: pull blocks lighter, outlines darker.
  dayCol = mix(vec3(0.7), dayCol, 0.5 + uDayContrast);

  // Night palette — warm tungsten lights for fills, dark streets for
  // outlines. Brightness scales with population (centre cities glow
  // brighter than small towns).
  float popLight = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.35, 1.0);
  vec3 nightFill = vec3(1.0, 0.85, 0.55) * blockBright * popLight * uNightBrightness;
  vec3 nightOutline = vec3(0.04, 0.03, 0.02);
  vec3 nightCol = mix(nightFill, nightOutline, outline);

  // Day/night wrap. Narrow terminator so the day side is fully day
  // (no tungsten warmth leaking onto buildings well clear of the
  // shadow line) and the night side is fully night.
  float wrap = smoothstep(-0.05, 0.15, dot(vSurfaceNormal, normalize(uSunDirection)));
  vec3 col = mix(nightCol, dayCol, wrap);

  // Population-driven opacity envelope: small towns are faint; megacities
  // fully opaque. Multiplied by radial density and the block masks so the
  // suburbs naturally fade.
  float popOpacity = clamp(log(max(vPopulation, 100.0)) / log(2.0e7), 0.25, 1.0);
  float a = (fill * (0.55 + 0.45 * density) + outline * 0.7);
  a *= popOpacity * landMask * uOpacity;
  if (a < 0.01) discard;

  fragColor = vec4(col, a);
}
`,fx=6371,mx=5e-4,qt={baseRadiusKm:30,minRadiusKm:5,maxRadiusKm:80,minPopulation:0,falloffStrength:3,gridDensity:10,blockThreshold:.25,outlineMin:.01,outlineMax:.06,nightBrightness:1.5,dayContrast:.5,opacity:.65};class vx{mesh;uniforms;material;geometry;constructor(e,t){const{nside:i,ordering:r}=e.getHealpixSpec(),a=qt.maxRadiusKm*1.1/fx;this.uniforms={uSunDirection:{value:new L(1,0,.3).normalize()},uIdRaster:{value:e.getIdRaster()},uHealpixNside:{value:i},uHealpixOrdering:{value:r==="ring"?0:1},uAttrTexWidth:{value:4*i},uElevationMeters:{value:e.getElevationMetersTexture()},uElevationScale:{value:Ri},uCityRadialBias:{value:mx},uHalfQuadSizeUnit:{value:a},uMaxRadiusKm:{value:qt.maxRadiusKm},uBaseRadiusKm:{value:qt.baseRadiusKm},uMinRadiusKm:{value:qt.minRadiusKm},uMinPopulation:{value:qt.minPopulation},uFalloffStrength:{value:qt.falloffStrength},uGridDensity:{value:qt.gridDensity},uBlockThreshold:{value:qt.blockThreshold},uOutlineMin:{value:qt.outlineMin},uOutlineMax:{value:qt.outlineMax},uNightBrightness:{value:qt.nightBrightness},uDayContrast:{value:qt.dayContrast},uOpacity:{value:qt.opacity}},this.material=new mt({uniforms:this.uniforms,glslVersion:Vt,vertexShader:`${Mi}
${dx}`,fragmentShader:`${Mi}
${px}`,transparent:!0,depthWrite:!1,depthTest:!0}),this.geometry=new _n(1,1);const o=t.length;this.mesh=new bu(this.geometry,this.material,Math.max(1,o)),this.mesh.frustumCulled=!1,this.mesh.renderOrder=0;const l=new Float32Array(Math.max(1,o)),c=new Float32Array(Math.max(1,o)*2),h=new Float32Array(Math.max(1,o)),u=new Mt;for(let d=0;d<o;d++){const m=t[d];l[d]=m.pop,c[d*2]=m.lat,c[d*2+1]=m.lon,h[d]=Math.abs(Math.sin(m.lat*12.9898+m.lon*78.233)*43758.5453123)%1e3,u.position.set(0,0,0),u.rotation.set(0,0,0),u.scale.set(1,1,1),u.updateMatrix(),this.mesh.setMatrixAt(d,u.matrix)}this.mesh.count=o,this.geometry.setAttribute("aPopulation",new Ct(l,1)),this.geometry.setAttribute("aLatLon",new Ct(c,2)),this.geometry.setAttribute("aPatternSeed",new Ct(h,1)),this.mesh.instanceMatrix.needsUpdate=!0,o===0&&(this.mesh.visible=!1)}setSunDirection(e){this.uniforms.uSunDirection.value.copy(e)}setActive(e){this.mesh.visible=e&&this.mesh.count>0}setElevationScale(e){this.uniforms.uElevationScale.value=e}dispose(){this.geometry.dispose(),this.material.dispose(),this.mesh.dispose()}}const gx=`// Airports — tiny tangent rectangles ("airstrips") at each airport's lat/lon.
//
// Per-instance attributes:
//   aLatLon   — (lat°, lon°)
//   aTraffic  — sum of incident route weights (used to scale the strip)
//
// We build the local tangent basis directly from lat/lon so the strip stays
// aligned with the local east/north regardless of where it sits on the globe.
// The strip is oriented along the local east axis (no real-world runway
// orientations available).

precision highp float;

uniform float uMinLengthKm;
uniform float uMaxLengthKm;
uniform float uWidthKm;
uniform float uRadialBias;     // unit-sphere offset above globe surface

in float aTraffic;
in vec2 aLatLon;

out float vTraffic;
out vec2 vQuadUV;

const float DEG = 0.017453292519943295;
const float EARTH_KM = 6371.0;

void main() {
  vQuadUV = uv;
  vTraffic = aTraffic;

  float lat = aLatLon.x * DEG;
  float lon = aLatLon.y * DEG;
  float cosLat = cos(lat);
  vec3 centre = vec3(cosLat * cos(lon), cosLat * sin(lon), sin(lat));
  vec3 normal = normalize(centre);

  // Local east = ∂/∂lon = (-sin(lon), cos(lon), 0). Local north completes
  // the right-handed basis.
  vec3 east = normalize(vec3(-sin(lon), cos(lon), 0.0));
  vec3 north = cross(normal, east);

  // Strip length scales with traffic, log-ish so megahubs don't dominate.
  float lenKm = mix(uMinLengthKm, uMaxLengthKm, clamp(log(1.0 + aTraffic) / log(80.0), 0.0, 1.0));
  float halfLenU = (lenKm * 0.5) / EARTH_KM;
  float halfWidU = (uWidthKm * 0.5) / EARTH_KM;

  vec2 local = (uv - 0.5) * 2.0;  // [-1, +1]
  vec3 lifted = normal * (1.0 + uRadialBias);
  vec3 worldPos = lifted + east * (local.x * halfLenU) + north * (local.y * halfWidU);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`,_x=`// Airports — flat solid colour with a soft edge so the strip doesn't look
// like a crisp hard-edged rectangle from far away.

precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

in vec2 vQuadUV;
in float vTraffic;

out vec4 fragColor;

void main() {
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float dx = abs(local.x);
  float dy = abs(local.y);

  // Slight feather so the rectangle has a hint of soft edge.
  float edgeX = 1.0 - smoothstep(0.85, 1.0, dx);
  float edgeY = 1.0 - smoothstep(0.5, 1.0, dy);
  float mask = edgeX * edgeY;
  if (mask < 0.05) discard;

  // Brightness scales mildly with traffic so the eye notices the hubs.
  float bright = mix(0.7, 1.0, clamp(log(1.0 + vTraffic) / log(80.0), 0.0, 1.0));
  fragColor = vec4(uColor * bright, mask * uOpacity);
}
`,Yi={minLengthKm:6,maxLengthKm:35,widthKm:1.2,radialBias:.0015,color:new we("#e8eef7"),opacity:.9};class xx{mesh;material;geometry;constructor(e){this.geometry=new _n(1,1),this.material=new mt({glslVersion:Vt,vertexShader:gx,fragmentShader:_x,transparent:!0,depthWrite:!1,depthTest:!0,uniforms:{uMinLengthKm:{value:Yi.minLengthKm},uMaxLengthKm:{value:Yi.maxLengthKm},uWidthKm:{value:Yi.widthKm},uRadialBias:{value:Yi.radialBias},uColor:{value:Yi.color.clone()},uOpacity:{value:Yi.opacity}}});const t=e.airportTraffic.length;this.mesh=new bu(this.geometry,this.material,Math.max(1,t)),this.mesh.frustumCulled=!1,this.mesh.renderOrder=5,this.geometry.setAttribute("aLatLon",new Ct(e.airportLatLons.slice(),2)),this.geometry.setAttribute("aTraffic",new Ct(e.airportTraffic.slice(),1));const i=new Mt;for(let r=0;r<t;r++)i.updateMatrix(),this.mesh.setMatrixAt(r,i.matrix);this.mesh.count=t,this.mesh.instanceMatrix.needsUpdate=!0}setActive(e){this.mesh.visible=e}dispose(){this.geometry.dispose(),this.material.dispose(),this.mesh.dispose()}}const bx=48;function Tu(){const n=bx,e=(n+1)*2,t=new Float32Array(e*3),i=new Float32Array(e),r=new Float32Array(e);for(let o=0;o<=n;o++){const l=o/n;i[o*2+0]=l,i[o*2+1]=l,r[o*2+0]=-1,r[o*2+1]=1}const s=new Uint16Array(n*6);for(let o=0;o<n;o++){const l=o*2+0,c=o*2+1,h=(o+1)*2+0,u=(o+1)*2+1;s[o*6+0]=l,s[o*6+1]=h,s[o*6+2]=c,s[o*6+3]=c,s[o*6+4]=h,s[o*6+5]=u}const a=new wu;return a.setAttribute("position",new St(t,3)),a.setAttribute("aV",new St(i,1)),a.setAttribute("aSide",new St(r,1)),a.setIndex(new St(s,1)),a}const Cu=`// Great-circle ribbon vertex shader.
//
// For each instance we slerp between src and dst lat/lon, applying a
// parabolic altitude profile peaking at the midpoint of the *full* route
// (not the trail) — that way a plane halfway through its trip sits at
// peak altitude regardless of how long its trail is.
//
// \`aTMin\` and \`aTMax\` are the bounds of the slerp parameter:
//   - route scaffold: aTMin=0, aTMax=1 → full arc src→dst
//   - active trail:   aTMin = origin-side dissipation, aTMax = head progress
//
// \`aSide\` thickens the ribbon perpendicular to its tangent in world space.
// For a slim hairline the constant uThicknessUnit is small enough to look
// like a single line at orbit camera distances.
//
// Altitude convention matches the rest of the project: an altitude \`m\`
// metres above sea level becomes a radial offset \`m * uElevationScale\` in
// rendered units. Bow peak scales with the chord length so long-haul
// flights arc more dramatically than regional hops, with a floor that
// guarantees every flight clears the cloud shell (top at 2500 m).

precision highp float;

uniform float uElevationScale;   // render-units per metre (matches LandMaterial)
uniform float uMinPeakM;         // floor for the bow peak, real metres
uniform float uPeakScale;        // peak-to-chord ratio in real units (peak_m = scale * chord_m)
uniform float uRadialBiasM;      // small bias above the surface, real metres
uniform float uThicknessUnit;    // half-width of the ribbon, unit-sphere units

in float aV;
in float aSide;
in vec4 aSrcDst;                 // (latA, lonA, latB, lonB) degrees
in float aTMin;
in float aTMax;
in float aAlpha;

out float vV;
out float vAlpha;
out float vTMax;
out float vSide;                 // -1..+1 across ribbon width, for soft edges

const float DEG = 0.017453292519943295;
const float EARTH_RADIUS_M = 6371000.0;

vec3 latLonToXyz(float latDeg, float lonDeg) {
  float lat = latDeg * DEG;
  float lon = lonDeg * DEG;
  float cl = cos(lat);
  return vec3(cl * cos(lon), cl * sin(lon), sin(lat));
}

// Spherical linear interpolation between two unit vectors.
vec3 slerp(vec3 a, vec3 b, float t, float omega, float sinO) {
  if (sinO < 1.0e-5) return normalize(mix(a, b, t));
  float wa = sin((1.0 - t) * omega) / sinO;
  float wb = sin(t * omega) / sinO;
  return wa * a + wb * b;
}

void main() {
  vV = aV;
  vAlpha = aAlpha;
  vTMax = aTMax;
  vSide = aSide;

  vec3 src = latLonToXyz(aSrcDst.x, aSrcDst.y);
  vec3 dst = latLonToXyz(aSrcDst.z, aSrcDst.w);
  float dotAB = clamp(dot(src, dst), -1.0, 1.0);
  float omega = acos(dotAB);
  float sinO = sin(omega);

  float tRoute = mix(aTMin, aTMax, aV);
  vec3 pos = slerp(src, dst, tRoute, omega, sinO);

  // Bow peak scales with the route chord length (so long-haul flights arc
  // more dramatically than short hops) AND with the elevation scale (so
  // the altitude slider lifts every bow uniformly with the rest of the
  // project). Working in real metres throughout — chord in unit-sphere
  // units × Earth radius gives real chord m, peakM is real altitude m,
  // and the final unit-sphere radial offset is \`peakM × elevationScale\`.
  float chordUnit = 2.0 * sin(omega * 0.5);
  float chordM    = chordUnit * EARTH_RADIUS_M;
  float peakM     = max(uMinPeakM, uPeakScale * chordM);
  float altM      = peakM * sin(3.14159265 * tRoute);
  float radial    = (uRadialBiasM + altM) * uElevationScale;
  vec3 worldPos   = pos * (1.0 + radial);

  // Tangent along the arc (analytic derivative of slerp).
  vec3 tangent;
  if (sinO < 1.0e-5) {
    tangent = normalize(dst - src);
  } else {
    float wa = -cos((1.0 - tRoute) * omega) * omega / sinO;
    float wb =  cos(tRoute * omega) * omega / sinO;
    tangent = normalize(wa * src + wb * dst);
  }

  // Lay the ribbon flat against the sphere — perpendicular to the tangent
  // along the surface. DoubleSide on the material ensures both faces draw
  // regardless of which way the perp ends up pointing.
  vec3 normal = normalize(worldPos);
  vec3 perp = normalize(cross(tangent, normal));

  worldPos += perp * (aSide * uThicknessUnit);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}
`,Au=`// Generic arc / trail fragment shader.
// Colour + opacity multiplier come from uniforms; per-instance alpha
// modulation comes from \`vAlpha\`. The optional \`uTrailFade\` ramps the
// alpha along the trail length so the head end is brighter than the
// origin end — set to 0 for the scaffold (no fade) or 1 for trails.
//
// Width-wise we use \`vSide\` (interpolated -1..+1 across the ribbon) to
// fade alpha to zero at the edges. Combined with a thicker ribbon this
// reads as a soft smoke trail rather than a hairline.

precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uTrailFade;   // 0 = uniform alpha, 1 = fade origin → head

in float vV;
in float vAlpha;
in float vTMax;
in float vSide;

out vec4 fragColor;

void main() {
  // Trail length fade: vV ∈ [0,1] runs origin → head; head brightest.
  float lenFade = mix(1.0, vV, uTrailFade);

  // Width fade: bell curve across the ribbon, 1 at centre falling to 0 at
  // the edges. Kept as a single (1 - vSide²) — squaring it again gives a
  // very narrow visible core that disappears on a thin ribbon.
  float widthFade = 1.0 - vSide * vSide;

  // Head taper: fade alpha to 0 in the last few percent of the trail so
  // the leading edge dissolves into the plane instead of looking like a
  // hard rectangular cap. uTrailFade>0 marks "this is a trail, not the
  // scaffold" — only taper for trails. Tight range so the trail fills in
  // close to the plane and only blends out in the final few pixels.
  float headTaper = mix(1.0, 1.0 - smoothstep(0.96, 1.0, vV), step(0.001, uTrailFade));

  float a = uOpacity * vAlpha * lenFade * widthFade * headTaper;
  if (a < 0.005) discard;
  fragColor = vec4(uColor, a);
}
`,pi={elevationScale:Ri,minPeakM:4e3,peakScale:.0013,radialBiasM:50,thicknessUnit:15e-5,color:new we("#7fb3ff"),opacity:.04};class yx{mesh;material;geometry;constructor(e){this.geometry=Tu();const t=e.routeWeight.length,i=new Float32Array(t*4),r=new Float32Array(t),s=new Float32Array(t),a=new Float32Array(t);for(let o=0;o<t;o++){const l=e.routeSrc[o],c=e.routeDst[o];i[o*4+0]=e.airportLatLons[l*2],i[o*4+1]=e.airportLatLons[l*2+1],i[o*4+2]=e.airportLatLons[c*2],i[o*4+3]=e.airportLatLons[c*2+1],r[o]=0,s[o]=1,a[o]=.4+.6*e.routeWeight[o]}this.geometry.setAttribute("aSrcDst",new Ct(i,4)),this.geometry.setAttribute("aTMin",new Ct(r,1)),this.geometry.setAttribute("aTMax",new Ct(s,1)),this.geometry.setAttribute("aAlpha",new Ct(a,1)),this.geometry.instanceCount=t,this.material=new mt({glslVersion:Vt,vertexShader:Cu,fragmentShader:Au,transparent:!0,depthWrite:!1,depthTest:!0,side:pn,uniforms:{uElevationScale:{value:pi.elevationScale},uMinPeakM:{value:pi.minPeakM},uPeakScale:{value:pi.peakScale},uRadialBiasM:{value:pi.radialBiasM},uThicknessUnit:{value:pi.thicknessUnit},uColor:{value:pi.color.clone()},uOpacity:{value:pi.opacity},uTrailFade:{value:0}}}),this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=6}setActive(e){this.mesh.visible=e}setOpacity(e){this.material.uniforms.uOpacity.value=e}setElevationScale(e){this.material.uniforms.uElevationScale.value=e}dispose(){this.geometry.dispose(),this.material.dispose()}}const fi={elevationScale:Ri,minPeakM:4e3,peakScale:.0013,radialBiasM:50,thicknessUnit:.008,color:new we("#ffffff"),opacity:.05};class wx{mesh;aSrcDstAttr;aTMinAttr;aTMaxAttr;aAlphaAttr;material;geometry;capacity;constructor(e){this.capacity=e,this.geometry=Tu();const t=new Float32Array(e*4),i=new Float32Array(e),r=new Float32Array(e),s=new Float32Array(e);this.aSrcDstAttr=new Ct(t,4),this.aTMinAttr=new Ct(i,1),this.aTMaxAttr=new Ct(r,1),this.aAlphaAttr=new Ct(s,1),this.aSrcDstAttr.setUsage(er),this.aTMinAttr.setUsage(er),this.aTMaxAttr.setUsage(er),this.aAlphaAttr.setUsage(er),this.geometry.setAttribute("aSrcDst",this.aSrcDstAttr),this.geometry.setAttribute("aTMin",this.aTMinAttr),this.geometry.setAttribute("aTMax",this.aTMaxAttr),this.geometry.setAttribute("aAlpha",this.aAlphaAttr),this.geometry.instanceCount=0,this.material=new mt({glslVersion:Vt,vertexShader:Cu,fragmentShader:Au,transparent:!0,depthWrite:!1,depthTest:!0,side:pn,blending:lr,uniforms:{uElevationScale:{value:fi.elevationScale},uMinPeakM:{value:fi.minPeakM},uPeakScale:{value:fi.peakScale},uRadialBiasM:{value:fi.radialBiasM},uThicknessUnit:{value:fi.thicknessUnit},uColor:{value:fi.color.clone()},uOpacity:{value:fi.opacity},uTrailFade:{value:1}}}),this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=7}setActiveCount(e){this.geometry.instanceCount=Math.min(e,this.capacity),this.aSrcDstAttr.needsUpdate=!0,this.aTMinAttr.needsUpdate=!0,this.aTMaxAttr.needsUpdate=!0,this.aAlphaAttr.needsUpdate=!0}setActive(e){this.mesh.visible=e}setOpacity(e){this.material.uniforms.uOpacity.value=e}setElevationScale(e){this.material.uniforms.uElevationScale.value=e}dispose(){this.geometry.dispose(),this.material.dispose()}}const Sx=`// Plane head — a screen-space billboard quad at the plane's current great-
// circle position. Quad is expanded in clip space so the dot stays a constant
// pixel size regardless of distance (within reason).
//
// Altitude math matches \`arc.vert.glsl\` exactly so the head sits on the
// trail (bow peak proportional to chord, with a metres-based floor).

precision highp float;

uniform float uElevationScale;
uniform float uMinPeakM;
uniform float uPeakScale;
uniform float uRadialBiasM;
uniform float uPixelSize;
uniform vec2 uViewportPx;

in vec4 aSrcDst;
in float aT;

out vec2 vQuadUV;
out float vBlinkPhase;

const float DEG = 0.017453292519943295;
const float EARTH_RADIUS_M = 6371000.0;

vec3 latLonToXyz(float latDeg, float lonDeg) {
  float lat = latDeg * DEG;
  float lon = lonDeg * DEG;
  float cl = cos(lat);
  return vec3(cl * cos(lon), cl * sin(lon), sin(lat));
}

vec3 slerp(vec3 a, vec3 b, float t, float omega, float sinO) {
  if (sinO < 1.0e-5) return normalize(mix(a, b, t));
  float wa = sin((1.0 - t) * omega) / sinO;
  float wb = sin(t * omega) / sinO;
  return wa * a + wb * b;
}

void main() {
  vQuadUV = uv;
  // Use the route src lat to seed a stable per-plane blink phase so heads
  // don't all blink in unison.
  vBlinkPhase = fract(aSrcDst.x * 0.137 + aSrcDst.y * 0.273);

  vec3 src = latLonToXyz(aSrcDst.x, aSrcDst.y);
  vec3 dst = latLonToXyz(aSrcDst.z, aSrcDst.w);
  float dotAB = clamp(dot(src, dst), -1.0, 1.0);
  float omega = acos(dotAB);
  float sinO = sin(omega);

  vec3 pos = slerp(src, dst, aT, omega, sinO);

  // Bow altitude in real metres × elevationScale — see arc.vert.glsl for
  // the rationale. The head must sit on the trail, so the math is identical.
  float chordUnit = 2.0 * sin(omega * 0.5);
  float chordM    = chordUnit * EARTH_RADIUS_M;
  float peakM     = max(uMinPeakM, uPeakScale * chordM);
  float altM      = peakM * sin(3.14159265 * aT);
  float radial    = (uRadialBiasM + altM) * uElevationScale;
  vec3 worldPos   = pos * (1.0 + radial);

  // Project the centre, then offset in clip XY by the quad UV.
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  vec2 offset = (uv - 0.5) * 2.0 * uPixelSize / uViewportPx * clip.w;
  clip.xy += offset;
  gl_Position = clip;
}
`,Mx=`// Plane head — a tiny red dot that flashes once per second and is invisible
// the rest of the time. Trails are the always-visible thing; this dot is
// just a marker that briefly says "here I am" each second.
//
// \`uTime\` is in seconds. Each plane has its own \`vBlinkPhase\` so the blinks
// sweep through the fleet rather than pulsing in unison.

precision highp float;

uniform float uTime;
uniform vec3 uColorBlink;
uniform float uOpacity;

in vec2 vQuadUV;
in float vBlinkPhase;

out vec4 fragColor;

void main() {
  vec2 local = (vQuadUV - 0.5) * 2.0;
  float r2 = dot(local, local);
  if (r2 > 1.0) discard;

  // 1 Hz blink — abs(sin) raised to a high power so the dot is only visible
  // for a brief flash each second (FWHM ≈ 0.19 s) rather than half the cycle.
  float blink = abs(sin(3.14159265 * (uTime + vBlinkPhase)));
  blink = pow(blink, 16.0);

  // Soft circular core — bright centre, fuzzy edge.
  float core = (1.0 - r2);
  core *= core;

  float a = uOpacity * core * blink;
  if (a < 0.005) discard;
  fragColor = vec4(uColorBlink, a);
}
`,mi={elevationScale:Ri,minPeakM:4e3,peakScale:.0013,radialBiasM:50,pixelSize:4,colorBlink:new we("#b32516"),opacity:1};class Ex{mesh;aSrcDstAttr;aTAttr;material;geometry;capacity;constructor(e){this.capacity=e;const t=new _n(1,1);this.geometry=new wu,this.geometry.setAttribute("position",t.getAttribute("position")),this.geometry.setAttribute("uv",t.getAttribute("uv")),this.geometry.setIndex(t.index);const i=new Float32Array(e*4),r=new Float32Array(e);this.aSrcDstAttr=new Ct(i,4),this.aTAttr=new Ct(r,1),this.aSrcDstAttr.setUsage(er),this.aTAttr.setUsage(er),this.geometry.setAttribute("aSrcDst",this.aSrcDstAttr),this.geometry.setAttribute("aT",this.aTAttr),this.geometry.instanceCount=0,this.material=new mt({glslVersion:Vt,vertexShader:Sx,fragmentShader:Mx,transparent:!0,depthWrite:!1,depthTest:!0,blending:lr,uniforms:{uTime:{value:0},uElevationScale:{value:mi.elevationScale},uMinPeakM:{value:mi.minPeakM},uPeakScale:{value:mi.peakScale},uRadialBiasM:{value:mi.radialBiasM},uPixelSize:{value:mi.pixelSize},uViewportPx:{value:new ye(1920,1080)},uColorBlink:{value:mi.colorBlink.clone()},uOpacity:{value:mi.opacity}}}),this.mesh=new ut(this.geometry,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=9,t.dispose()}setActiveCount(e){this.geometry.instanceCount=Math.min(e,this.capacity),this.aSrcDstAttr.needsUpdate=!0,this.aTAttr.needsUpdate=!0}setTime(e){this.material.uniforms.uTime.value=e}setViewport(e,t){this.material.uniforms.uViewportPx.value.set(e,t)}setActive(e){this.mesh.visible=e}setElevationScale(e){this.material.uniforms.uElevationScale.value=e}dispose(){this.geometry.dispose(),this.material.dispose()}}const Qa=850,lh=.3,Tx=2200,Cx=8192,Ax=4;class Px{group;airports;scaffold;trails;heads;data;capacity=Cx;planeRouteIdx;planeT;planeTTail;planeSpeed;planeAlpha;activeCount=0;routeSpawnAccum;routeBaseRate;simHoursPerRealSecond=1;targetInFlight=Tx;elapsedRealSeconds=0;sunLonRad=0;constructor(e){this.data=e,this.group=new Un,this.group.name="airplanes",this.airports=new xx(e),this.scaffold=new yx(e),this.trails=new wx(this.capacity),this.heads=new Ex(this.capacity),this.group.add(this.airports.mesh),this.group.add(this.scaffold.mesh),this.group.add(this.trails.mesh),this.group.add(this.heads.mesh),this.planeRouteIdx=new Uint32Array(this.capacity),this.planeT=new Float32Array(this.capacity),this.planeTTail=new Float32Array(this.capacity),this.planeSpeed=new Float32Array(this.capacity),this.planeAlpha=new Float32Array(this.capacity);const t=e.routeWeight.length;this.routeSpawnAccum=new Float32Array(t),this.routeBaseRate=new Float32Array(t),this.computeRouteRates(),this.prefillToSteadyState()}setSpeed(e){this.simHoursPerRealSecond=Math.max(0,e)}setTargetInFlight(e){const t=Math.floor(this.capacity/2);this.targetInFlight=Math.max(0,Math.min(t,e)),this.computeRouteRates()}setSunLonRad(e){this.sunLonRad=e}setLayerActive(e,t){e==="airports"?this.airports.setActive(t):e==="scaffold"?this.scaffold.setActive(t):e==="trails"?this.trails.setActive(t):e==="heads"&&this.heads.setActive(t)}setViewport(e,t){this.heads.setViewport(e,t)}update(e){this.elapsedRealSeconds+=e,this.heads.setTime(this.elapsedRealSeconds);const t=e*this.simHoursPerRealSecond,i=t*3600;if(i<=0){this.repackInstances();return}this.advancePlanes(i),this.spawnPlanes(t),this.repackInstances()}dispose(){this.airports.dispose(),this.scaffold.dispose(),this.trails.dispose(),this.heads.dispose()}prefillToSteadyState(){if(this.targetInFlight<=0)return;const e=this.data.routeWeight.length;let t=0;const i=new Float32Array(e);for(let s=0;s<e;s++){const a=Math.max(50,this.data.routeDistanceKm[s]);i[s]=a/Qa,t+=this.routeBaseRate[s]*i[s]}if(t<=0)return;const r=this.targetInFlight/t;for(let s=0;s<e;s++){const a=this.routeBaseRate[s]*i[s]*r,o=Math.floor(a),l=a-o,c=o+(Math.random()<l?1:0),h=Math.max(50,this.data.routeDistanceKm[s]),u=Qa/h/3600,d=.6+.4*this.data.routeWeight[s];for(let m=0;m<c&&this.activeCount<this.capacity;m++){const g=this.activeCount++;this.planeRouteIdx[g]=s;const x=Math.random()*.999;this.planeT[g]=x,this.planeTTail[g]=Math.max(0,x-lh),this.planeSpeed[g]=u,this.planeAlpha[g]=d}}}computeRouteRates(){const e=this.data.routeWeight.length;let t=0;for(let r=0;r<e;r++)t+=this.data.routeWeight[r];if(t<=0)return;const i=this.targetInFlight/Ax;for(let r=0;r<e;r++)this.routeBaseRate[r]=this.data.routeWeight[r]/t*i}advancePlanes(e){let t=0;for(;t<this.activeCount;){const i=this.planeSpeed[t];let r=this.planeT[t],s=this.planeTTail[t];if(r<1)r+=i*e,r>=1&&(r=1),this.planeT[t]=r,this.planeTTail[t]=Math.max(0,r-lh),t++;else if(s+=i*e,s>=1){const a=this.activeCount-1;t!==a&&(this.planeRouteIdx[t]=this.planeRouteIdx[a],this.planeT[t]=this.planeT[a],this.planeTTail[t]=this.planeTTail[a],this.planeSpeed[t]=this.planeSpeed[a],this.planeAlpha[t]=this.planeAlpha[a]),this.activeCount=a}else this.planeTTail[t]=s,t++}}spawnPlanes(e){const t=this.data.routeWeight.length,i=this.sunLonRad;for(let r=0;r<t;r++){const s=this.data.routeMidpointLon[r]-i,o=1+.5*(Math.cos(s)*Math.cos(this.data.routeMidpointLat[r])),l=this.routeBaseRate[r]*e*o;let c=this.routeSpawnAccum[r]+l;for(;c>=1&&this.activeCount<this.capacity;){const h=this.activeCount++;this.planeRouteIdx[h]=r,this.planeT[h]=0,this.planeTTail[h]=0;const u=Math.max(50,this.data.routeDistanceKm[r]);this.planeSpeed[h]=Qa/u/3600,this.planeAlpha[h]=.6+.4*this.data.routeWeight[r],c-=1}this.routeSpawnAccum[r]=c}}repackInstances(){const e=this.trails.aSrcDstAttr.array,t=this.trails.aTMinAttr.array,i=this.trails.aTMaxAttr.array,r=this.trails.aAlphaAttr.array,s=this.heads.aSrcDstAttr.array,a=this.heads.aTAttr.array,o=this.data.airportLatLons,l=this.data.routeSrc,c=this.data.routeDst;let h=0;for(let u=0;u<this.activeCount;u++){const d=this.planeRouteIdx[u],m=l[d],g=c[d],x=o[m*2],p=o[m*2+1],f=o[g*2],M=o[g*2+1],y=u*4;if(e[y+0]=x,e[y+1]=p,e[y+2]=f,e[y+3]=M,t[u]=this.planeTTail[u],i[u]=this.planeT[u],r[u]=this.planeAlpha[u],this.planeT[u]<1){const S=h*4;s[S+0]=x,s[S+1]=p,s[S+2]=f,s[S+3]=M,a[h]=this.planeT[u],h++}}this.trails.setActiveCount(this.activeCount),this.heads.setActiveCount(h)}}const Rx="/airplanes/airports.json",Dx="/airplanes/routes.json",Lx=6371,sn=Math.PI/180;function Ix(n,e,t,i){const r=n*sn,s=t*sn,a=(t-n)*sn,o=(i-e)*sn,l=Math.sin(a/2)**2+Math.cos(r)*Math.cos(s)*Math.sin(o/2)**2;return 2*Lx*Math.asin(Math.min(1,Math.sqrt(l)))}function Ux(n,e,t,i){const r=n*sn,s=t*sn,a=(i-e)*sn,o=Math.cos(s)*Math.cos(a),l=Math.cos(s)*Math.sin(a),c=Math.atan2(Math.sin(r)+Math.sin(s),Math.sqrt((Math.cos(r)+o)**2+l**2)),h=e*sn+Math.atan2(l,Math.cos(r)+o);return{lat:c/sn,lon:h/sn}}async function Nx(){const[n,e]=await Promise.all([fetch(Rx),fetch(Dx)]);if(!n.ok)throw new Error(`airports.json: ${n.status}`);if(!e.ok)throw new Error(`routes.json: ${e.status}`);const t=await n.json(),i=await e.json(),r=t.airports.length,s=new Float32Array(r*2),a=new Float32Array(r),o=new Array(r);for(let x=0;x<r;x++){const p=t.airports[x];s[x*2]=p.lat,s[x*2+1]=p.lon,a[x]=p.traffic,o[x]=p.iata}const l=i.routes.length,c=new Uint32Array(l),h=new Uint32Array(l),u=new Float32Array(l),d=new Float32Array(l),m=new Float32Array(l),g=new Float32Array(l);for(let x=0;x<l;x++){const p=i.routes[x];c[x]=p.a,h[x]=p.b,u[x]=p.w;const f=s[p.a*2],M=s[p.a*2+1],y=s[p.b*2],S=s[p.b*2+1];d[x]=Ix(f,M,y,S);const N=Ux(f,M,y,S);g[x]=N.lat*sn,m[x]=N.lon*sn}return console.info(`[airplanes] loaded ${r} airports, ${l} routes (median distance ${Math.round(Fx(d))} km)`),{airportLatLons:s,airportTraffic:a,airportIatas:o,routeSrc:c,routeDst:h,routeWeight:u,routeDistanceKm:d,routeMidpointLon:m,routeMidpointLat:g}}function Fx(n){const e=Array.from(n).sort((t,i)=>t-i);return e[Math.floor(e.length/2)]??0}const eo=60,ch=60;class Ox{group=new Un;sunMesh;moonMesh;sunMat;moonMat;tmpDir=new L;constructor(){const e={uColor:{value:new we("#ffd9a0")},uGlowColor:{value:new we("#ffaa55")},uIntensity:{value:6}},t={uColor:{value:new we("#cfd6e0")},uGlowColor:{value:new we("#7d869a")},uIntensity:{value:1}},i=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,r=`
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform vec3 uGlowColor;
      uniform float uIntensity;
      void main() {
        // Distance from quad centre.
        vec2 d = vUv - vec2(0.5);
        float r = length(d) * 2.0;
        // Disk: solid up to 0.6, then ramp down to 1.0 (glow falloff).
        float disk = 1.0 - smoothstep(0.0, 0.6, r);
        float glow = 1.0 - smoothstep(0.0, 1.0, r);
        glow = glow * glow;
        if (r > 1.0) discard;
        vec3 col = mix(uGlowColor, uColor, disk);
        float a = max(disk, glow * 0.6) * uIntensity;
        gl_FragColor = vec4(col * a, a);
      }
    `;this.sunMat=new mt({uniforms:e,vertexShader:i,fragmentShader:r,transparent:!0,depthWrite:!1,blending:lr}),this.moonMat=new mt({uniforms:t,vertexShader:i,fragmentShader:r,transparent:!0,depthWrite:!1,blending:lr});const s=Math.tan(.18)*eo,a=Math.tan(.12)*ch;this.sunMesh=new ut(new _n(s*2,s*2),this.sunMat),this.moonMesh=new ut(new _n(a*2,a*2),this.moonMat),this.sunMesh.renderOrder=0,this.moonMesh.renderOrder=0,this.group.add(this.sunMesh),this.group.add(this.moonMesh)}setSunDiskSize(e){const t=Math.tan(e)*eo;this.sunMesh.geometry.dispose(),this.sunMesh.geometry=new _n(t*2,t*2)}syncFromCamera(e,t){this.tmpDir.copy(t).normalize(),this.sunMesh.position.copy(this.tmpDir).multiplyScalar(eo),this.moonMesh.position.copy(this.tmpDir).multiplyScalar(-ch),this.sunMesh.lookAt(e.position),this.moonMesh.lookAt(e.position)}dispose(){this.sunMesh.geometry.dispose(),this.moonMesh.geometry.dispose(),this.sunMat.dispose(),this.moonMat.dispose()}}const $i=3,kx=23.4*Math.PI/180,Bx=.04;function zx(){const n=new xu;n.background=new we("#06080c");const e=new rn(45,1,.1,100);e.up.set(0,0,1),e.position.set($i,$i*.4,$i*.5),e.lookAt(0,0,0);let t=null,i=null,r=null,s=null;const a=new H_(16774358,1);a.position.set(3,2,1.5),n.add(a),n.add(new G_(2240582,.3));const o=new L().copy(a.position).normalize();let l=null,c=null,h=null,u=null,d=null,m=null;const g=new Ox;n.add(g.group);let x=null,p=0;const f=new X_,M=new ye,y=new L;function S(z){r=z,s=new ex(z,n,e),l=new G0(z,{atmosphereRadius:sh(5)}),l.setSunDirection(o),l.syncFromCamera(e),n.add(l.mesh)}function N(z,C){c=z,i=C,t=new Y_(e,C),t.enableDamping=!0,t.minDistance=1.2,t.maxDistance=30,t.target.set(0,0,0),h=new A0(z),h.setSunDirection(o),n.add(h.group),u=new ux(z),u.setSunDirection(o),u.syncFromCamera(e),n.add(u.mesh),d=new vx(z,z.getCities()),d.setSunDirection(o),n.add(d.mesh),Nx().then(V=>{m=new Px(V),n.add(m.group)}).catch(V=>{console.warn("[airplanes] disabled:",V)}),x=V=>{if(!c)return;const U=C.getBoundingClientRect(),ee=(V.clientX-U.left)/U.width*2-1,Q=-((V.clientY-U.top)/U.height*2-1);M.set(ee,Q),f.setFromCamera(M,e);const Z=c.pickFromRay(f.ray);A(c,Z)},C.addEventListener("pointerdown",x)}function A(z,C){if(!C){T.value="(no body — click on the globe)",console.info("[pick] no body");return}const V=z.getBody(C.bodyId);if(!V){T.value=`(body id ${C.bodyId} not in registry)`,console.warn("[pick] body id missing from registry",C);return}const U={id:V.id,type:V.type,display_name:V.display_name,area_km2:V.area_km2,centroid:V.centroid,bbox:V.bbox,cellIndex:C.cellIndex,lat:Number(C.lat.toFixed(3)),lon:Number(C.lon.toFixed(3))};T.value=JSON.stringify(U,null,2),console.info("[pick]",U,V.metadata)}const T={value:"(click on the globe)"};function F(z){const C=(z.timeOfDay.t01-.5)*Math.PI*2;y.set(Math.cos(C),Math.sin(C),Math.sin(kx)).normalize(),a.position.copy(y).multiplyScalar(3),h?.setSunDirection(y),l?.setSunDirection(y),u?.setSunDirection(y),d?.setSunDirection(y),g.syncFromCamera(e,y)}function K(z){const C=z.materials.globe;if(h){const Z=h.uniforms.land;Z.uAmbient.value=C.ambient,Z.uNightTint.value.set(C.nightTint),Z.uColorFire.value.set(C.lerpColorFire),Z.uColorIce.value.set(C.lerpColorIce),Z.uColorInfection.value.set(C.lerpColorInfection),Z.uColorPollution.value.set(C.lerpColorPollution),Z.uLerpStrength.value.set(C.lerpStrengthFire,C.lerpStrengthIce,C.lerpStrengthInfection,C.lerpStrengthPollution),Z.uBiomeStrength.value=C.biomeStrength,Z.uSnowLineStrength.value=C.snowLineStrength,Z.uSeasonOffsetC.value=C.seasonOffsetC,Z.uAlpineStrength.value=C.alpineStrength;const ge=z.materials.ocean,Pe=h.uniforms.water;Pe.uAmbient.value=C.ambient,Pe.uNightTint.value.set(C.nightTint),Pe.uOceanDeep.value.set(ge.deepColor),Pe.uOceanShallow.value.set(ge.shallowColor),Pe.uWaveAmplitude.value=ge.waveAmplitude,Pe.uWaveSpeed.value=ge.waveSpeed,Pe.uWaveSteepness.value=ge.waveSteepness,Pe.uFresnelStrength.value=ge.fresnelStrength,Pe.uCurrentStrength.value=ge.currentStrength,Pe.uStreamlinesEnabled.value=ge.streamlinesEnabled?1:0,Pe.uStrongJetsOnly.value=ge.strongJetsOnly?1:0}if(u){const Z=z.materials.clouds;u.setDensity(Z.density),u.setCoverage(Z.coverage),u.setBeer(Z.beer),u.setHenyey(Z.henyey),u.setAdvection(Z.advection)}if(d){const Z=z.materials.cities,ge=d.uniforms;ge.uBaseRadiusKm.value=Z.baseRadiusKm,ge.uMinRadiusKm.value=Z.minRadiusKm,ge.uMaxRadiusKm.value=Z.maxRadiusKm,ge.uMinPopulation.value=Z.minPopulation,ge.uFalloffStrength.value=Z.falloffStrength,ge.uGridDensity.value=Z.gridDensity,ge.uBlockThreshold.value=Z.blockThreshold,ge.uOutlineMin.value=Z.outlineMin,ge.uOutlineMax.value=Z.outlineMax,ge.uNightBrightness.value=Z.nightBrightness,ge.uDayContrast.value=Z.dayContrast,ge.uOpacity.value=Z.opacity}const V=z.altitude.scaleFactor,U=Eu(V),ee=sh(V);h&&(h.uniforms.land.uElevationScale.value=U,h.uniforms.water.uElevationScale.value=U),u?.setElevationScale(U),d?.setElevationScale(U),m&&(m.trails.setElevationScale(U),m.scaffold.setElevationScale(U),m.heads.setElevationScale(U));const Q=z.materials.atmosphere;l&&(l.setScales(Q.rayleighScale,Q.mieScale,ee),l.setExposure(Q.exposure),l.setSunDiskAngleDeg(Q.sunDiskSize*60)),g.setSunDiskSize(Q.sunDiskSize)}function v(z){h&&(h.group.visible=z.layers.globe||z.layers.ocean,h.land.mesh.visible=z.layers.globe,h.water.mesh.visible=z.layers.ocean),l&&(l.mesh.visible=z.layers.atmosphere),u?.setActive(z.layers.clouds),d?.setActive(z.layers.cities),m&&(m.setLayerActive("airports",z.layers.airports),m.setLayerActive("scaffold",z.layers.routeScaffold),m.setLayerActive("trails",z.layers.trails),m.setLayerActive("heads",z.layers.planes))}function w(z,C){if(C.camera.autoOrbit?(t&&(t.enabled=!1),p+=z*C.camera.orbitSpeed*Math.PI*2,e.position.set(Math.cos(p)*$i,Math.sin(p)*$i,$i*.5),e.lookAt(0,0,0)):t&&(t.enabled=!0,t.update()),n.background instanceof we&&n.background.set(C.scene.background),C.pick.lastPick=T.value,!C.timeOfDay.paused){const V=C.timeOfDay.t01+z*Bx;C.timeOfDay.t01=V-Math.floor(V)}if(K(C),F(C),v(C),h&&(h.uniforms.water.uTime.value+=z),l?.syncFromCamera(e),u?.syncFromCamera(e),u?.update(z),m){m.setSpeed(C.airplanes.speed),m.setTargetInFlight(C.airplanes.targetInFlight),m.scaffold.setOpacity(C.airplanes.scaffoldOpacity),m.trails.setOpacity(C.airplanes.trailOpacity);const V=(C.timeOfDay.t01-.5)*Math.PI*2;m.setSunLonRad(V),m.update(z)}}function H(z){if(s){s.render(z);return}r&&r.render(n,e)}function G(z,C){e.aspect=z/Math.max(1,C),e.updateProjectionMatrix(),s?.setSize(z,C),m?.setViewport(z,C)}function X(){x&&i&&i.removeEventListener("pointerdown",x),x=null,i=null,h?.dispose(),h=null,u?.dispose(),u=null,d?.dispose(),d=null,m?.dispose(),m=null,l?.dispose(),l=null,g.dispose(),t?.dispose(),t=null,s?.dispose(),s=null,r=null}return{scene:n,camera:e,attachRenderer:S,attachWorld:N,update:w,render:H,resize:G,dispose:X}}const Vx=31,Hx=139;async function Pu(n){if(n.headers.get("content-encoding")?.toLowerCase()==="gzip")return await n.arrayBuffer();if((n.headers.get("content-type")??"").includes("text/html"))return await n.body?.cancel(),null;const t=await n.arrayBuffer(),i=new Uint8Array(t);if(i.length<2||i[0]!==Vx||i[1]!==Hx)return null;const r=new Blob([t]).stream().pipeThrough(new DecompressionStream("gzip"));return await new Response(r).arrayBuffer()}async function ua(n){const e=await fetch(`${n}.gz`);if(e.ok){const i=await Pu(e);if(i!==null)return i}else await e.body?.cancel();const t=await fetch(n);if(!t.ok)throw new Error(`fetch failed: ${t.status} ${t.statusText} (${n})`);return await t.arrayBuffer()}async function Ru(n){const e=await fetch(`${n}.gz`);if(e.ok){const i=await Pu(e);if(i!==null){const r=new TextDecoder("utf-8").decode(i);return JSON.parse(r)}}else await e.body?.cancel();const t=await fetch(n);if(!t.ok)throw new Error(`fetch failed: ${t.status} ${t.statusText} (${n})`);return await t.json()}function Gx(n){switch(n){case"fire":return 0;case"ice":return 1;case"infection":return 2;case"pollution":return 3;default:return null}}function Wx(n){return!Number.isFinite(n)||n<=0?0:n>=255?255:n|0}const hh={elevation:{source:"static",byteOffset:0,byteWidth:1},temperature:{source:"climate",byteOffset:0,byteWidth:2},moisture:{source:"climate",byteOffset:2,byteWidth:2},fire:{source:"dynamic",byteOffset:0,byteWidth:1},ice:{source:"dynamic",byteOffset:1,byteWidth:1},infection:{source:"dynamic",byteOffset:2,byteWidth:1},pollution:{source:"dynamic",byteOffset:3,byteWidth:1}};class xl{static async load(e,t,i){const r=12*i*i,[s,a,o,l,c]=await Promise.all([Dr(`${t}/${e.attribute_static.path}`,r*4),Dr(`${t}/${e.attribute_climate_init.path}`,r*4),Dr(`${t}/${e.attribute_dynamic_init.path}`,r*4),Dr(`${t}/${e.elevation_meters.path}`,r*2),Dr(`${t}/${e.water_level_meters.path}`,r*2)]);return new xl(i,s,a,o,l,c)}nside;staticBytes;climateBytes;dynamicBytes;elevMetersBytes;waterLevelMetersBytes;textures=new Map;constructor(e,t,i,r,s,a){this.nside=e,this.staticBytes=new Uint8Array(t),this.climateBytes=new Uint8Array(i),this.dynamicBytes=new Uint8Array(r),this.elevMetersBytes=new Uint8Array(s),this.waterLevelMetersBytes=new Uint8Array(a)}getElevationMetersTexture(){const e=this.textures.get("elevMeters");if(e)return e;const t=4*this.nside,i=3*this.nside,r=new Uint16Array(this.elevMetersBytes.buffer,this.elevMetersBytes.byteOffset,this.elevMetersBytes.byteLength/2),s=new Ln(r,t,i,Vr,$t);return s.minFilter=ct,s.magFilter=ct,s.wrapS=_t,s.wrapT=_t,s.needsUpdate=!0,this.textures.set("elevMeters",s),s}getWaterLevelMetersTexture(){const e=this.textures.get("waterLevelMeters");if(e)return e;const t=4*this.nside,i=3*this.nside,r=new Uint16Array(this.waterLevelMetersBytes.buffer,this.waterLevelMetersBytes.byteOffset,this.waterLevelMetersBytes.byteLength/2),s=new Ln(r,t,i,Vr,$t);return s.minFilter=ct,s.magFilter=ct,s.wrapS=_t,s.wrapT=_t,s.needsUpdate=!0,this.textures.set("waterLevelMeters",s),s}getTexture(e){const t=hh[e];return t?this._sourceTexture(t.source):this._zeroTexture()}applyAttributeDelta(e,t,i){const r=Gx(e);if(r===null||t.length!==i.length)return;const s=4;for(let o=0;o<t.length;o++){const l=t[o],c=i[o],h=Wx(Math.round(c*255));this.dynamicBytes[l*s+r]=h}const a=this.textures.get("dynamic");a&&(a.needsUpdate=!0)}getValue(e,t,i,r){const s=hh[e];if(!s)return 0;const o=r*4+s.byteOffset,l=s.source==="static"?this.staticBytes:s.source==="climate"?this.climateBytes:this.dynamicBytes;if(s.byteWidth===1)return l[o]??0;const c=l[o]??0,h=l[o+1]??0;return Xx(h<<8|c)}_sourceTexture(e){const t=this.textures.get(e);if(t)return t;const i=4*this.nside,r=3*this.nside;let s;if(e==="climate"){const a=new Uint16Array(this.climateBytes.buffer,this.climateBytes.byteOffset,this.climateBytes.byteLength/2);s=new Ln(a,i,r,qr,$t)}else{const o=e==="static"?this.staticBytes:this.dynamicBytes;s=new Ln(o,i,r,Yt,xn)}return s.minFilter=ct,s.magFilter=ct,s.wrapS=_t,s.wrapT=_t,s.needsUpdate=!0,this.textures.set(e,s),s}_zeroTexture(){const e=this.textures.get("zero");if(e)return e;const t=new Ln(new Uint8Array([0,0,0,0]),1,1);return t.needsUpdate=!0,this.textures.set("zero",t),t}}async function Dr(n,e){const t=await ua(n);if(t.byteLength!==e)throw new Error(`attribute size mismatch at ${n}: got ${t.byteLength}, expected ${e}`);return t}function Xx(n){const e=(n&32768)>>15,t=(n&31744)>>10,i=n&1023;return t===0?(e?-1:1)*Math.pow(2,-14)*(i/1024):t===31?i?NaN:e?-1/0:1/0:(e?-1:1)*Math.pow(2,t-15)*(1+i/1024)}class jx{idIndex=new Map;bodies;constructor(e){this.bodies=e,e.forEach((t,i)=>this.idIndex.set(t.id,i))}get count(){return this.bodies.length}getBody(e){const t=this.idIndex.get(e);return t===void 0?null:this.bodies[t]??null}getByIndex(e){return e<=0||e>this.bodies.length?null:this.bodies[e-1]??null}getByType(e){return this.bodies.filter(t=>t.type===e)}}const to=2*Math.PI,Kx=Math.PI/2;function Jo(n,e,t,i){const s=(i%to+to)%to/Kx%4;return e==="ring"?qx(n,t,s):Yx(n,t,s)}function qx(n,e,t){const i=Math.abs(e),r=4*n;if(i<=2/3){const u=n*(.5+t),d=n*.75*e;let m=Math.floor(u-d);const g=Math.floor(u+d);e===0&&m===g&&(m-=1);const x=n+1+m-g,p=1-(x&1);let f=Math.floor((m+g-n+p+1)/2);return f=(f%r+r)%r,2*n*(n-1)+(x-1)*r+f}const s=t-Math.floor(t),a=n*Math.sqrt(3*(1-i)),o=Math.floor(s*a),l=Math.floor((1-s)*a),c=o+l+1;let h=Math.floor(t*c%(4*c));return h<0&&(h+=4*c),e>0?2*c*(c-1)+h:12*n*n-2*c*(c+1)+h}function Yx(n,e,t){const i=Math.abs(e);let r,s,a;if(i<=2/3){const o=n*(.5+t),l=n*.75*e;let c=Math.floor(o-l);const h=Math.floor(o+l);e===0&&c===h&&(c-=1);const u=Math.floor(c/n),d=Math.floor(h/n);u===d?r=u&3|4:u<d?r=u&3:r=(d&3)+8,s=(h%n+n)%n,a=n-1-(c%n+n)%n}else{const o=Math.min(3,Math.floor(t)),l=t-o,c=n*Math.sqrt(3*(1-i)),h=Math.floor(l*c),u=Math.floor((1-l)*c),d=Math.min(n-1,h),m=Math.min(n-1,u);e>=0?(r=o,s=n-m-1,a=n-d-1):(r=o+8,s=d,a=m)}return r*n*n+$x(s,a)}function $x(n,e){return uh(n)|uh(e)<<1}function uh(n){let e=n&65535;return e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,e}const dh=Math.PI/180;class bl{constructor(e,t,i){this.cells=e,this.nside=t,this.ordering=i}static async load(e,t,i){const r=await ua(e),s=12*t*t*4;if(r.byteLength!==s)throw new Error(`id_raster size mismatch: got ${r.byteLength} bytes, expected ${s} for nside=${t}`);return new bl(new Uint32Array(r),t,i)}texture=null;bodyIndexAtCell(e){return e<0||e>=this.cells.length?0:this.cells[e]??0}bodyIndexAt(e,t){const i=Math.sin(e*dh),r=t*dh,s=Jo(this.nside,this.ordering,i,r);return this.bodyIndexAtCell(s)}toDataTexture(){if(this.texture)return this.texture;const e=4*this.nside,t=3*this.nside,i=this.cells,r=new Ln(i,e,t,na,ii);return r.internalFormat="R32UI",r.minFilter=ct,r.magFilter=ct,r.wrapS=_t,r.wrapT=_t,r.needsUpdate=!0,this.texture=r,r}}class Zx{listeners=new Set;worker=null;constructor(){globalThis.__ED_DISABLE_SIM_WORKER||typeof Worker>"u"||(this.worker=new Worker(new URL("/assets/index-DJXcrp7M.js",import.meta.url),{type:"module",name:"earth-destroyer-sim"}),this.worker.onmessage=t=>{this.dispatch(t.data)},this.worker.onerror=t=>{console.error("[sim worker]",t.message,t.error)})}postCommand(e){this.worker&&this.worker.postMessage(e)}onUpdate(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}dispatch(e){for(const t of this.listeners)t(e)}dispose(){this.listeners.clear(),this.worker?.terminate(),this.worker=null}}const ph=180/Math.PI;function Jx(n){const e=Math.max(-1,Math.min(1,n.z));return{lat:Math.asin(e)*ph,lon:Math.atan2(n.y,n.x)*ph}}async function Qx(n){return await Ru(n)}const fh=1381319503,eb=1,Lr=32;class yl{constructor(e,t){this.texture=e,this.header=t}static async load(e){const t=await ua(e);if(t.byteLength<Lr)throw new Error(`ocean_currents too small: ${t.byteLength} bytes < header ${Lr}`);const i=new DataView(t,0,Lr),r=i.getUint32(0,!0),s=i.getUint32(4,!0),a=i.getUint32(8,!0),o=i.getUint32(12,!0);if(r!==fh)throw new Error(`ocean_currents bad magic: 0x${r.toString(16)} (expected 0x${fh.toString(16)})`);if(s!==eb)throw new Error(`ocean_currents unsupported version: ${s}`);const l=Lr+a*o*4;if(t.byteLength!==l)throw new Error(`ocean_currents size mismatch: got ${t.byteLength}, expected ${l} (${a}×${o})`);const h=new Uint16Array(t,Lr,a*o*2),u=new Ln(h,a,o,qr,$t);return u.minFilter=Tt,u.magFilter=Tt,u.wrapS=dr,u.wrapT=_t,u.needsUpdate=!0,new yl(u,{width:a,height:o})}dispose(){this.texture.dispose()}}const mh=1145981271,tb=1,Ir=32;class wl{constructor(e,t){this.texture=e,this.header=t}static async load(e){const t=await ua(e);if(t.byteLength<Ir)throw new Error(`wind_field too small: ${t.byteLength} bytes < header ${Ir}`);const i=new DataView(t,0,Ir),r=i.getUint32(0,!0),s=i.getUint32(4,!0),a=i.getUint32(8,!0),o=i.getUint32(12,!0);if(r!==mh)throw new Error(`wind_field bad magic: 0x${r.toString(16)} (expected 0x${mh.toString(16)})`);if(s!==tb)throw new Error(`wind_field unsupported version: ${s}`);const l=Ir+a*o*4;if(t.byteLength!==l)throw new Error(`wind_field size mismatch: got ${t.byteLength}, expected ${l} (${a}×${o})`);const h=new Uint16Array(t,Ir,a*o*2),u=new Ln(h,a,o,qr,$t);return u.minFilter=Tt,u.magFilter=Tt,u.wrapS=dr,u.wrapT=_t,u.needsUpdate=!0,new wl(u,{width:a,height:o})}dispose(){this.texture.dispose()}}const Is=Math.PI/180,nb={human_population:0,animal_species_count:0,urban_pct:0,ocean_temp_avg_c:0,forest_cover_pct:0,ice_cover_pct:0,atmospheric_co2_ppm:0,biodiversity_index:0};async function ib(n={}){const e=n.manifestUrl??"/world/earth_v1/world_manifest.json",t=await Qx(e),i=e.slice(0,e.lastIndexOf("/")),{nside:r,ordering:s}=t.healpix,[a,o,l,c,h]=await Promise.all([bl.load(`${i}/${t.artifacts.id_raster.path}`,r,s),xl.load({attribute_static:t.artifacts.attribute_static,attribute_climate_init:t.artifacts.attribute_climate_init,attribute_dynamic_init:t.artifacts.attribute_dynamic_init,elevation_meters:t.artifacts.elevation_meters,water_level_meters:t.artifacts.water_level_meters},i,r),t.graphs.wind_field.size_bytes>32?wl.load(`${i}/${t.graphs.wind_field.path}`):Promise.resolve(null),t.graphs.ocean_currents.size_bytes>32?yl.load(`${i}/${t.graphs.ocean_currents.path}`):Promise.resolve(null),rb(`${i}/${t.artifacts.cities.path}`)]),u=new jx(t.bodies),d=new Zx,m=new L,g=new gr(new L(0,0,0),1),x=new Set,p=new Set,f=new Set,M={getBody:S=>u.getBody(S),getBodyAt:(S,N)=>{const A=a.bodyIndexAt(S,N);return u.getByIndex(A)},pickFromRay:S=>{const N=S.intersectSphere(g,m);if(!N)return null;const{lat:A,lon:T}=Jx(N),F=Math.sin(A*Is),K=T*Is,v=Jo(r,s,F,K),w=a.bodyIndexAtCell(v);if(w===0)return null;const H=u.getByIndex(w);return H?{bodyId:H.id,cellIndex:v,lat:A,lon:T,worldPos:N.clone()}:null},getAttribute:(S,N,A)=>{const T=Math.sin(N*Is),F=A*Is,K=Jo(r,s,T,F);return o.getValue(S,N,A,K)},getIdRaster:()=>a.toDataTexture(),getAttributeTexture:S=>o.getTexture(S),getElevationMetersTexture:()=>o.getElevationMetersTexture(),getWaterLevelMetersTexture:()=>o.getWaterLevelMetersTexture(),getHealpixSpec:()=>({nside:r,ordering:s}),getWindFieldTexture:()=>l?l.texture:null,getOceanCurrentsTexture:()=>c?c.texture:null,getCities:()=>h,getAggregates:()=>nb,onAttributeChanged:S=>(x.add(S),()=>{x.delete(S)}),onBodyTopologyChanged:S=>(p.add(S),()=>{p.delete(S)}),onAggregatesUpdated:S=>(f.add(S),()=>{f.delete(S)})};return d.onUpdate(S=>{S.type==="attribute_delta"?(o.applyAttributeDelta(S.attr,S.cells,S.values),x.forEach(N=>N(S.attr,[]))):S.type==="topology_change"?p.forEach(N=>N(S.changes)):S.type==="tick_complete"&&f.forEach(N=>N(S.aggregates))}),d.postCommand({type:"init",manifestUrl:e}),{world:M,sim:{tick:S=>d.postCommand({type:"tick",deltaMs:S}),injectEvent:S=>d.postCommand({type:"inject_event",event:S}),setSpeed:S=>d.postCommand({type:"set_speed",multiplier:S}),snapshotSave:S=>d.postCommand({type:"snapshot_save",tag:S}),snapshotLoad:S=>d.postCommand({type:"snapshot_load",tag:S})}}}async function rb(n){try{const e=await Ru(n);return Array.isArray(e?.cities)?e.cities:(console.warn(`[cities] missing 'cities' array in ${n}`),[])}catch(e){return console.warn(`[cities] load error from ${n}:`,e),[]}}/*! Tweakpane 4.0.5 (c) 2016 cocopon, licensed under the MIT license. */function tt(n){return n==null}function Sl(n){return n!==null&&typeof n=="object"}function Qo(n){return n!==null&&typeof n=="object"}function sb(n,e){if(n.length!==e.length)return!1;for(let t=0;t<n.length;t++)if(n[t]!==e[t])return!1;return!0}function Ei(n,e){return Array.from(new Set([...Object.keys(n),...Object.keys(e)])).reduce((i,r)=>{const s=n[r],a=e[r];return Qo(s)&&Qo(a)?Object.assign(Object.assign({},i),{[r]:Ei(s,a)}):Object.assign(Object.assign({},i),{[r]:r in e?a:s})},{})}function Ml(n){return Sl(n)?"target"in n:!1}const ab={alreadydisposed:()=>"View has been already disposed",invalidparams:n=>`Invalid parameters for '${n.name}'`,nomatchingcontroller:n=>`No matching controller for '${n.key}'`,nomatchingview:n=>`No matching view for '${JSON.stringify(n.params)}'`,notbindable:()=>"Value is not bindable",notcompatible:n=>`Not compatible with  plugin '${n.id}'`,propertynotfound:n=>`Property '${n.name}' not found`,shouldneverhappen:()=>"This error should never happen"};class ht{static alreadyDisposed(){return new ht({type:"alreadydisposed"})}static notBindable(){return new ht({type:"notbindable"})}static notCompatible(e,t){return new ht({type:"notcompatible",context:{id:`${e}.${t}`}})}static propertyNotFound(e){return new ht({type:"propertynotfound",context:{name:e}})}static shouldNeverHappen(){return new ht({type:"shouldneverhappen"})}constructor(e){var t;this.message=(t=ab[e.type](e.context))!==null&&t!==void 0?t:"Unexpected error",this.name=this.constructor.name,this.stack=new Error(this.message).stack,this.type=e.type}toString(){return this.message}}class $s{constructor(e,t){this.obj_=e,this.key=t}static isBindable(e){return!(e===null||typeof e!="object"&&typeof e!="function")}read(){return this.obj_[this.key]}write(e){this.obj_[this.key]=e}writeProperty(e,t){const i=this.read();if(!$s.isBindable(i))throw ht.notBindable();if(!(e in i))throw ht.propertyNotFound(e);i[e]=t}}class vt{constructor(){this.observers_={}}on(e,t,i){var r;let s=this.observers_[e];return s||(s=this.observers_[e]=[]),s.push({handler:t,key:(r=i?.key)!==null&&r!==void 0?r:t}),this}off(e,t){const i=this.observers_[e];return i&&(this.observers_[e]=i.filter(r=>r.key!==t)),this}emit(e,t){const i=this.observers_[e];i&&i.forEach(r=>{r.handler(t)})}}class ob{constructor(e,t){var i;this.constraint_=t?.constraint,this.equals_=(i=t?.equals)!==null&&i!==void 0?i:(r,s)=>r===s,this.emitter=new vt,this.rawValue_=e}get constraint(){return this.constraint_}get rawValue(){return this.rawValue_}set rawValue(e){this.setRawValue(e,{forceEmit:!1,last:!0})}setRawValue(e,t){const i=t??{forceEmit:!1,last:!0},r=this.constraint_?this.constraint_.constrain(e):e,s=this.rawValue_;this.equals_(s,r)&&!i.forceEmit||(this.emitter.emit("beforechange",{sender:this}),this.rawValue_=r,this.emitter.emit("change",{options:i,previousRawValue:s,rawValue:r,sender:this}))}}class lb{constructor(e){this.emitter=new vt,this.value_=e}get rawValue(){return this.value_}set rawValue(e){this.setRawValue(e,{forceEmit:!1,last:!0})}setRawValue(e,t){const i=t??{forceEmit:!1,last:!0},r=this.value_;r===e&&!i.forceEmit||(this.emitter.emit("beforechange",{sender:this}),this.value_=e,this.emitter.emit("change",{options:i,previousRawValue:r,rawValue:this.value_,sender:this}))}}class cb{constructor(e){this.emitter=new vt,this.onValueBeforeChange_=this.onValueBeforeChange_.bind(this),this.onValueChange_=this.onValueChange_.bind(this),this.value_=e,this.value_.emitter.on("beforechange",this.onValueBeforeChange_),this.value_.emitter.on("change",this.onValueChange_)}get rawValue(){return this.value_.rawValue}onValueBeforeChange_(e){this.emitter.emit("beforechange",Object.assign(Object.assign({},e),{sender:this}))}onValueChange_(e){this.emitter.emit("change",Object.assign(Object.assign({},e),{sender:this}))}}function st(n,e){const t=e?.constraint,i=e?.equals;return!t&&!i?new lb(n):new ob(n,e)}function hb(n){return[new cb(n),(e,t)=>{n.setRawValue(e,t)}]}class Ne{constructor(e){this.emitter=new vt,this.valMap_=e;for(const t in this.valMap_)this.valMap_[t].emitter.on("change",()=>{this.emitter.emit("change",{key:t,sender:this})})}static createCore(e){return Object.keys(e).reduce((i,r)=>Object.assign(i,{[r]:st(e[r])}),{})}static fromObject(e){const t=this.createCore(e);return new Ne(t)}get(e){return this.valMap_[e].rawValue}set(e,t){this.valMap_[e].rawValue=t}value(e){return this.valMap_[e]}}class Jr{constructor(e){this.values=Ne.fromObject({max:e.max,min:e.min})}constrain(e){const t=this.values.get("max"),i=this.values.get("min");return Math.min(Math.max(e,i),t)}}class ub{constructor(e){this.values=Ne.fromObject({max:e.max,min:e.min})}constrain(e){const t=this.values.get("max"),i=this.values.get("min");let r=e;return tt(i)||(r=Math.max(r,i)),tt(t)||(r=Math.min(r,t)),r}}class db{constructor(e,t=0){this.step=e,this.origin=t}constrain(e){const t=this.origin%this.step,i=Math.round((e-t)/this.step);return t+i*this.step}}class pb{constructor(e){this.text=e}evaluate(){return Number(this.text)}toString(){return this.text}}const fb={"**":(n,e)=>Math.pow(n,e),"*":(n,e)=>n*e,"/":(n,e)=>n/e,"%":(n,e)=>n%e,"+":(n,e)=>n+e,"-":(n,e)=>n-e,"<<":(n,e)=>n<<e,">>":(n,e)=>n>>e,">>>":(n,e)=>n>>>e,"&":(n,e)=>n&e,"^":(n,e)=>n^e,"|":(n,e)=>n|e};class mb{constructor(e,t,i){this.left=t,this.operator=e,this.right=i}evaluate(){const e=fb[this.operator];if(!e)throw new Error(`unexpected binary operator: '${this.operator}`);return e(this.left.evaluate(),this.right.evaluate())}toString(){return["b(",this.left.toString(),this.operator,this.right.toString(),")"].join(" ")}}const vb={"+":n=>n,"-":n=>-n,"~":n=>~n};class gb{constructor(e,t){this.operator=e,this.expression=t}evaluate(){const e=vb[this.operator];if(!e)throw new Error(`unexpected unary operator: '${this.operator}`);return e(this.expression.evaluate())}toString(){return["u(",this.operator,this.expression.toString(),")"].join(" ")}}function El(n){return(e,t)=>{for(let i=0;i<n.length;i++){const r=n[i](e,t);if(r!=="")return r}return""}}function Hr(n,e){var t;const i=n.substr(e).match(/^\s+/);return(t=i&&i[0])!==null&&t!==void 0?t:""}function _b(n,e){const t=n.substr(e,1);return t.match(/^[1-9]$/)?t:""}function Gr(n,e){var t;const i=n.substr(e).match(/^[0-9]+/);return(t=i&&i[0])!==null&&t!==void 0?t:""}function xb(n,e){const t=Gr(n,e);if(t!=="")return t;const i=n.substr(e,1);if(e+=1,i!=="-"&&i!=="+")return"";const r=Gr(n,e);return r===""?"":i+r}function Tl(n,e){const t=n.substr(e,1);if(e+=1,t.toLowerCase()!=="e")return"";const i=xb(n,e);return i===""?"":t+i}function Du(n,e){const t=n.substr(e,1);if(t==="0")return t;const i=_b(n,e);return e+=i.length,i===""?"":i+Gr(n,e)}function bb(n,e){const t=Du(n,e);if(e+=t.length,t==="")return"";const i=n.substr(e,1);if(e+=i.length,i!==".")return"";const r=Gr(n,e);return e+=r.length,t+i+r+Tl(n,e)}function yb(n,e){const t=n.substr(e,1);if(e+=t.length,t!==".")return"";const i=Gr(n,e);return e+=i.length,i===""?"":t+i+Tl(n,e)}function wb(n,e){const t=Du(n,e);return e+=t.length,t===""?"":t+Tl(n,e)}const Sb=El([bb,yb,wb]);function Mb(n,e){var t;const i=n.substr(e).match(/^[01]+/);return(t=i&&i[0])!==null&&t!==void 0?t:""}function Eb(n,e){const t=n.substr(e,2);if(e+=t.length,t.toLowerCase()!=="0b")return"";const i=Mb(n,e);return i===""?"":t+i}function Tb(n,e){var t;const i=n.substr(e).match(/^[0-7]+/);return(t=i&&i[0])!==null&&t!==void 0?t:""}function Cb(n,e){const t=n.substr(e,2);if(e+=t.length,t.toLowerCase()!=="0o")return"";const i=Tb(n,e);return i===""?"":t+i}function Ab(n,e){var t;const i=n.substr(e).match(/^[0-9a-f]+/i);return(t=i&&i[0])!==null&&t!==void 0?t:""}function Pb(n,e){const t=n.substr(e,2);if(e+=t.length,t.toLowerCase()!=="0x")return"";const i=Ab(n,e);return i===""?"":t+i}const Rb=El([Eb,Cb,Pb]),Db=El([Rb,Sb]);function Lb(n,e){const t=Db(n,e);return e+=t.length,t===""?null:{evaluable:new pb(t),cursor:e}}function Ib(n,e){const t=n.substr(e,1);if(e+=t.length,t!=="(")return null;const i=Iu(n,e);if(!i)return null;e=i.cursor,e+=Hr(n,e).length;const r=n.substr(e,1);return e+=r.length,r!==")"?null:{evaluable:i.evaluable,cursor:e}}function Ub(n,e){var t;return(t=Lb(n,e))!==null&&t!==void 0?t:Ib(n,e)}function Lu(n,e){const t=Ub(n,e);if(t)return t;const i=n.substr(e,1);if(e+=i.length,i!=="+"&&i!=="-"&&i!=="~")return null;const r=Lu(n,e);return r?(e=r.cursor,{cursor:e,evaluable:new gb(i,r.evaluable)}):null}function Nb(n,e,t){t+=Hr(e,t).length;const i=n.filter(r=>e.startsWith(r,t))[0];return i?(t+=i.length,t+=Hr(e,t).length,{cursor:t,operator:i}):null}function Fb(n,e){return(t,i)=>{const r=n(t,i);if(!r)return null;i=r.cursor;let s=r.evaluable;for(;;){const a=Nb(e,t,i);if(!a)break;i=a.cursor;const o=n(t,i);if(!o)return null;i=o.cursor,s=new mb(a.operator,s,o.evaluable)}return s?{cursor:i,evaluable:s}:null}}const Ob=[["**"],["*","/","%"],["+","-"],["<<",">>>",">>"],["&"],["^"],["|"]].reduce((n,e)=>Fb(n,e),Lu);function Iu(n,e){return e+=Hr(n,e).length,Ob(n,e)}function kb(n){const e=Iu(n,0);return!e||e.cursor+Hr(n,e.cursor).length!==n.length?null:e.evaluable}function Bn(n){var e;const t=kb(n);return(e=t?.evaluate())!==null&&e!==void 0?e:null}function Uu(n){if(typeof n=="number")return n;if(typeof n=="string"){const e=Bn(n);if(!tt(e))return e}return 0}function Bb(n){return String(n)}function Ht(n){return e=>e.toFixed(Math.max(Math.min(n,20),0))}function Ye(n,e,t,i,r){const s=(n-e)/(t-e);return i+s*(r-i)}function vh(n){return String(n.toFixed(10)).split(".")[1].replace(/0+$/,"").length}function xt(n,e,t){return Math.min(Math.max(n,e),t)}function Nu(n,e){return(n%e+e)%e}function zb(n,e){return tt(n.step)?Math.max(vh(e),2):vh(n.step)}function Fu(n){var e;return(e=n.step)!==null&&e!==void 0?e:1}function Ou(n,e){var t;const i=Math.abs((t=n.step)!==null&&t!==void 0?t:e);return i===0?.1:Math.pow(10,Math.floor(Math.log10(i))-1)}function ku(n,e){return tt(n.step)?null:new db(n.step,e)}function Bu(n){return!tt(n.max)&&!tt(n.min)?new Jr({max:n.max,min:n.min}):!tt(n.max)||!tt(n.min)?new ub({max:n.max,min:n.min}):null}function zu(n,e){var t,i,r;return{formatter:(t=n.format)!==null&&t!==void 0?t:Ht(zb(n,e)),keyScale:(i=n.keyScale)!==null&&i!==void 0?i:Fu(n),pointerScale:(r=n.pointerScale)!==null&&r!==void 0?r:Ou(n,e)}}function Vu(n){return{format:n.optional.function,keyScale:n.optional.number,max:n.optional.number,min:n.optional.number,pointerScale:n.optional.number,step:n.optional.number}}function Cl(n){return{constraint:n.constraint,textProps:Ne.fromObject(zu(n.params,n.initialValue))}}class Di{constructor(e){this.controller=e}get element(){return this.controller.view.element}get disabled(){return this.controller.viewProps.get("disabled")}set disabled(e){this.controller.viewProps.set("disabled",e)}get hidden(){return this.controller.viewProps.get("hidden")}set hidden(e){this.controller.viewProps.set("hidden",e)}dispose(){this.controller.viewProps.set("disposed",!0)}importState(e){return this.controller.importState(e)}exportState(){return this.controller.exportState()}}class da{constructor(e){this.target=e}}class Qr extends da{constructor(e,t,i){super(e),this.value=t,this.last=i??!0}}class Vb extends da{constructor(e,t){super(e),this.expanded=t}}class Hb extends da{constructor(e,t){super(e),this.index=t}}class Gb extends da{constructor(e,t){super(e),this.native=t}}class Wr extends Di{constructor(e){super(e),this.onValueChange_=this.onValueChange_.bind(this),this.emitter_=new vt,this.controller.value.emitter.on("change",this.onValueChange_)}get label(){return this.controller.labelController.props.get("label")}set label(e){this.controller.labelController.props.set("label",e)}get key(){return this.controller.value.binding.target.key}get tag(){return this.controller.tag}set tag(e){this.controller.tag=e}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}refresh(){this.controller.value.fetch()}onValueChange_(e){const t=this.controller.value;this.emitter_.emit("change",new Qr(this,t.binding.target.read(),e.options.last))}}class Wb{constructor(e,t){this.onValueBeforeChange_=this.onValueBeforeChange_.bind(this),this.onValueChange_=this.onValueChange_.bind(this),this.binding=t,this.value_=e,this.value_.emitter.on("beforechange",this.onValueBeforeChange_),this.value_.emitter.on("change",this.onValueChange_),this.emitter=new vt}get rawValue(){return this.value_.rawValue}set rawValue(e){this.value_.rawValue=e}setRawValue(e,t){this.value_.setRawValue(e,t)}fetch(){this.value_.rawValue=this.binding.read()}push(){this.binding.write(this.value_.rawValue)}onValueBeforeChange_(e){this.emitter.emit("beforechange",Object.assign(Object.assign({},e),{sender:this}))}onValueChange_(e){this.push(),this.emitter.emit("change",Object.assign(Object.assign({},e),{sender:this}))}}function Xb(n){if(!("binding"in n))return!1;const e=n.binding;return Ml(e)&&"read"in e&&"write"in e}function jb(n,e){const i=Object.keys(e).reduce((r,s)=>{if(r===void 0)return;const a=e[s],o=a(n[s]);return o.succeeded?Object.assign(Object.assign({},r),{[s]:o.value}):void 0},{});return i}function Kb(n,e){return n.reduce((t,i)=>{if(t===void 0)return;const r=e(i);if(!(!r.succeeded||r.value===void 0))return[...t,r.value]},[])}function qb(n){return n===null?!1:typeof n=="object"}function Pn(n){return e=>t=>{if(!e&&t===void 0)return{succeeded:!1,value:void 0};if(e&&t===void 0)return{succeeded:!0,value:void 0};const i=n(t);return i!==void 0?{succeeded:!0,value:i}:{succeeded:!1,value:void 0}}}function gh(n){return{custom:e=>Pn(e)(n),boolean:Pn(e=>typeof e=="boolean"?e:void 0)(n),number:Pn(e=>typeof e=="number"?e:void 0)(n),string:Pn(e=>typeof e=="string"?e:void 0)(n),function:Pn(e=>typeof e=="function"?e:void 0)(n),constant:e=>Pn(t=>t===e?e:void 0)(n),raw:Pn(e=>e)(n),object:e=>Pn(t=>{if(qb(t))return jb(t,e)})(n),array:e=>Pn(t=>{if(Array.isArray(t))return Kb(t,e)})(n)}}const el={optional:gh(!0),required:gh(!1)};function ot(n,e){const t=e(el),i=el.required.object(t)(n);return i.succeeded?i.value:void 0}function Jt(n,e,t,i){if(e&&!e(n))return!1;const r=ot(n,t);return r?i(r):!1}function Qt(n,e){var t;return Ei((t=n?.())!==null&&t!==void 0?t:{},e)}function wi(n){return"value"in n}function Hu(n){if(!Sl(n)||!("binding"in n))return!1;const e=n.binding;return Ml(e)}const gn="http://www.w3.org/2000/svg";function Zs(n){n.offsetHeight}function Yb(n,e){const t=n.style.transition;n.style.transition="none",e(),n.style.transition=t}function Al(n){return n.ontouchstart!==void 0}function $b(){return globalThis}function Zb(){return $b().document}function Jb(n){const e=n.ownerDocument.defaultView;return e&&"document"in e?n.getContext("2d",{willReadFrequently:!0}):null}const Qb={check:'<path d="M2 8l4 4l8 -8"/>',dropdown:'<path d="M5 7h6l-3 3 z"/>',p2dpad:'<path d="M8 4v8"/><path d="M4 8h8"/><circle cx="12" cy="12" r="1.2"/>'};function pa(n,e){const t=n.createElementNS(gn,"svg");return t.innerHTML=Qb[e],t}function Gu(n,e,t){n.insertBefore(e,n.children[t])}function Pl(n){n.parentElement&&n.parentElement.removeChild(n)}function Wu(n){for(;n.children.length>0;)n.removeChild(n.children[0])}function ey(n){for(;n.childNodes.length>0;)n.removeChild(n.childNodes[0])}function Xu(n){return n.relatedTarget?n.relatedTarget:"explicitOriginalTarget"in n?n.explicitOriginalTarget:null}function On(n,e){n.emitter.on("change",t=>{e(t.rawValue)}),e(n.rawValue)}function yn(n,e,t){On(n.value(e),t)}const ty="tp";function Ve(n){return(t,i)=>[ty,"-",n,"v",t?`_${t}`:"",i?`-${i}`:""].join("")}const Ur=Ve("lbl");function ny(n,e){const t=n.createDocumentFragment();return e.split(`
`).map(r=>n.createTextNode(r)).forEach((r,s)=>{s>0&&t.appendChild(n.createElement("br")),t.appendChild(r)}),t}class ju{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Ur()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add(Ur("l")),yn(t.props,"label",s=>{tt(s)?this.element.classList.add(Ur(void 0,"nol")):(this.element.classList.remove(Ur(void 0,"nol")),ey(i),i.appendChild(ny(e,s)))}),this.element.appendChild(i),this.labelElement=i;const r=e.createElement("div");r.classList.add(Ur("v")),this.element.appendChild(r),this.valueElement=r}}class Ku{constructor(e,t){this.props=t.props,this.valueController=t.valueController,this.viewProps=t.valueController.viewProps,this.view=new ju(e,{props:t.props,viewProps:this.viewProps}),this.view.valueElement.appendChild(this.valueController.view.element)}importProps(e){return Jt(e,null,t=>({label:t.optional.string}),t=>(this.props.set("label",t.label),!0))}exportProps(){return Qt(null,{label:this.props.get("label")})}}function iy(){return["veryfirst","first","last","verylast"]}const _h=Ve(""),xh={veryfirst:"vfst",first:"fst",last:"lst",verylast:"vlst"};class fa{constructor(e){this.parent_=null,this.blade=e.blade,this.view=e.view,this.viewProps=e.viewProps;const t=this.view.element;this.blade.value("positions").emitter.on("change",()=>{iy().forEach(i=>{t.classList.remove(_h(void 0,xh[i]))}),this.blade.get("positions").forEach(i=>{t.classList.add(_h(void 0,xh[i]))})}),this.viewProps.handleDispose(()=>{Pl(t)})}get parent(){return this.parent_}set parent(e){this.parent_=e,this.viewProps.set("parent",this.parent_?this.parent_.viewProps:null)}importState(e){return Jt(e,null,t=>({disabled:t.required.boolean,hidden:t.required.boolean}),t=>(this.viewProps.importState(t),!0))}exportState(){return Qt(null,Object.assign({},this.viewProps.exportState()))}}class Ti extends fa{constructor(e,t){if(t.value!==t.valueController.value)throw ht.shouldNeverHappen();const i=t.valueController.viewProps,r=new Ku(e,{blade:t.blade,props:t.props,valueController:t.valueController});super(Object.assign(Object.assign({},t),{view:new ju(e,{props:t.props,viewProps:i}),viewProps:i})),this.labelController=r,this.value=t.value,this.valueController=t.valueController,this.view.valueElement.appendChild(this.valueController.view.element)}importState(e){return Jt(e,t=>{var i,r,s;return super.importState(t)&&this.labelController.importProps(t)&&((s=(r=(i=this.valueController).importProps)===null||r===void 0?void 0:r.call(i,e))!==null&&s!==void 0?s:!0)},t=>({value:t.optional.raw}),t=>(t.value&&(this.value.rawValue=t.value),!0))}exportState(){var e,t,i;return Qt(()=>super.exportState(),Object.assign(Object.assign({value:this.value.rawValue},this.labelController.exportProps()),(i=(t=(e=this.valueController).exportProps)===null||t===void 0?void 0:t.call(e))!==null&&i!==void 0?i:{}))}}function bh(n){const e=Object.assign({},n);return delete e.value,e}class qu extends Ti{constructor(e,t){super(e,t),this.tag=t.tag}importState(e){return Jt(e,t=>super.importState(bh(e)),t=>({tag:t.optional.string}),t=>(this.tag=t.tag,!0))}exportState(){return Qt(()=>bh(super.exportState()),{binding:{key:this.value.binding.target.key,value:this.value.binding.target.read()},tag:this.tag})}}function ry(n){return wi(n)&&Hu(n.value)}class sy extends qu{importState(e){return Jt(e,t=>super.importState(t),t=>({binding:t.required.object({value:t.required.raw})}),t=>(this.value.binding.inject(t.binding.value),this.value.fetch(),!0))}}function ay(n){return wi(n)&&Xb(n.value)}function Yu(n,e){for(;n.length<e;)n.push(void 0)}function oy(n){const e=[];return Yu(e,n),e}function ly(n){const e=n.indexOf(void 0);return e<0?n:n.slice(0,e)}function cy(n,e){const t=[...ly(n),e];return t.length>n.length?t.splice(0,t.length-n.length):Yu(t,n.length),t}class hy{constructor(e){this.emitter=new vt,this.onTick_=this.onTick_.bind(this),this.onValueBeforeChange_=this.onValueBeforeChange_.bind(this),this.onValueChange_=this.onValueChange_.bind(this),this.binding=e.binding,this.value_=st(oy(e.bufferSize)),this.value_.emitter.on("beforechange",this.onValueBeforeChange_),this.value_.emitter.on("change",this.onValueChange_),this.ticker=e.ticker,this.ticker.emitter.on("tick",this.onTick_),this.fetch()}get rawValue(){return this.value_.rawValue}set rawValue(e){this.value_.rawValue=e}setRawValue(e,t){this.value_.setRawValue(e,t)}fetch(){this.value_.rawValue=cy(this.value_.rawValue,this.binding.read())}onTick_(){this.fetch()}onValueBeforeChange_(e){this.emitter.emit("beforechange",Object.assign(Object.assign({},e),{sender:this}))}onValueChange_(e){this.emitter.emit("change",Object.assign(Object.assign({},e),{sender:this}))}}function uy(n){if(!("binding"in n))return!1;const e=n.binding;return Ml(e)&&"read"in e&&!("write"in e)}class dy extends qu{exportState(){return Qt(()=>super.exportState(),{binding:{readonly:!0}})}}function py(n){return wi(n)&&uy(n.value)}class fy extends Di{get label(){return this.controller.labelController.props.get("label")}set label(e){this.controller.labelController.props.set("label",e)}get title(){var e;return(e=this.controller.buttonController.props.get("title"))!==null&&e!==void 0?e:""}set title(e){this.controller.buttonController.props.set("title",e)}on(e,t){const i=t.bind(this);return this.controller.buttonController.emitter.on(e,s=>{i(new Gb(this,s.nativeEvent))}),this}off(e,t){return this.controller.buttonController.emitter.off(e,t),this}}function my(n,e,t){t?n.classList.add(e):n.classList.remove(e)}function xr(n,e){return t=>{my(n,e,t)}}function Rl(n,e){On(n,t=>{e.textContent=t??""})}const no=Ve("btn");class vy{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(no()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("button");i.classList.add(no("b")),t.viewProps.bindDisabled(i),this.element.appendChild(i),this.buttonElement=i;const r=e.createElement("div");r.classList.add(no("t")),Rl(t.props.value("title"),r),this.buttonElement.appendChild(r)}}class gy{constructor(e,t){this.emitter=new vt,this.onClick_=this.onClick_.bind(this),this.props=t.props,this.viewProps=t.viewProps,this.view=new vy(e,{props:this.props,viewProps:this.viewProps}),this.view.buttonElement.addEventListener("click",this.onClick_)}importProps(e){return Jt(e,null,t=>({title:t.optional.string}),t=>(this.props.set("title",t.title),!0))}exportProps(){return Qt(null,{title:this.props.get("title")})}onClick_(e){this.emitter.emit("click",{nativeEvent:e,sender:this})}}class yh extends fa{constructor(e,t){const i=new gy(e,{props:t.buttonProps,viewProps:t.viewProps}),r=new Ku(e,{blade:t.blade,props:t.labelProps,valueController:i});super({blade:t.blade,view:r.view,viewProps:t.viewProps}),this.buttonController=i,this.labelController=r}importState(e){return Jt(e,t=>super.importState(t)&&this.buttonController.importProps(t)&&this.labelController.importProps(t),()=>({}),()=>!0)}exportState(){return Qt(()=>super.exportState(),Object.assign(Object.assign({},this.buttonController.exportProps()),this.labelController.exportProps()))}}class $u{constructor(e){const[t,i]=e.split("-"),r=t.split(".");this.major=parseInt(r[0],10),this.minor=parseInt(r[1],10),this.patch=parseInt(r[2],10),this.prerelease=i??null}toString(){const e=[this.major,this.minor,this.patch].join(".");return this.prerelease!==null?[e,this.prerelease].join("-"):e}}const br=new $u("2.0.5");function Ut(n){return Object.assign({core:br},n)}const _y=Ut({id:"button",type:"blade",accept(n){const e=ot(n,t=>({title:t.required.string,view:t.required.constant("button"),label:t.optional.string}));return e?{params:e}:null},controller(n){return new yh(n.document,{blade:n.blade,buttonProps:Ne.fromObject({title:n.params.title}),labelProps:Ne.fromObject({label:n.params.label}),viewProps:n.viewProps})},api(n){return n.controller instanceof yh?new fy(n.controller):null}});function xy(n,e){return n.addBlade(Object.assign(Object.assign({},e),{view:"button"}))}function by(n,e){return n.addBlade(Object.assign(Object.assign({},e),{view:"folder"}))}function yy(n,e){return n.addBlade(Object.assign(Object.assign({},e),{view:"tab"}))}function wy(n){return Sl(n)?"refresh"in n&&typeof n.refresh=="function":!1}function Sy(n,e){if(!$s.isBindable(n))throw ht.notBindable();return new $s(n,e)}class My{constructor(e,t){this.onRackValueChange_=this.onRackValueChange_.bind(this),this.controller_=e,this.emitter_=new vt,this.pool_=t,this.controller_.rack.emitter.on("valuechange",this.onRackValueChange_)}get children(){return this.controller_.rack.children.map(e=>this.pool_.createApi(e))}addBinding(e,t,i){const r=i??{},s=this.controller_.element.ownerDocument,a=this.pool_.createBinding(s,Sy(e,t),r),o=this.pool_.createBindingApi(a);return this.add(o,r.index)}addFolder(e){return by(this,e)}addButton(e){return xy(this,e)}addTab(e){return yy(this,e)}add(e,t){const i=e.controller;return this.controller_.rack.add(i,t),e}remove(e){this.controller_.rack.remove(e.controller)}addBlade(e){const t=this.controller_.element.ownerDocument,i=this.pool_.createBlade(t,e),r=this.pool_.createApi(i);return this.add(r,e.index)}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}refresh(){this.children.forEach(e=>{wy(e)&&e.refresh()})}onRackValueChange_(e){const t=e.bladeController,i=this.pool_.createApi(t),r=Hu(t.value)?t.value.binding:null;this.emitter_.emit("change",new Qr(i,r?r.target.read():t.value.rawValue,e.options.last))}}class Dl extends Di{constructor(e,t){super(e),this.rackApi_=new My(e.rackController,t)}refresh(){this.rackApi_.refresh()}}class Ll extends fa{constructor(e){super({blade:e.blade,view:e.view,viewProps:e.rackController.viewProps}),this.rackController=e.rackController}importState(e){return Jt(e,t=>super.importState(t),t=>({children:t.required.array(t.required.raw)}),t=>this.rackController.rack.children.every((i,r)=>i.importState(t.children[r])))}exportState(){return Qt(()=>super.exportState(),{children:this.rackController.rack.children.map(e=>e.exportState())})}}function tl(n){return"rackController"in n}class Ey{constructor(e){this.emitter=new vt,this.items_=[],this.cache_=new Set,this.onSubListAdd_=this.onSubListAdd_.bind(this),this.onSubListRemove_=this.onSubListRemove_.bind(this),this.extract_=e}get items(){return this.items_}allItems(){return Array.from(this.cache_)}find(e){for(const t of this.allItems())if(e(t))return t;return null}includes(e){return this.cache_.has(e)}add(e,t){if(this.includes(e))throw ht.shouldNeverHappen();const i=t!==void 0?t:this.items_.length;this.items_.splice(i,0,e),this.cache_.add(e);const r=this.extract_(e);r&&(r.emitter.on("add",this.onSubListAdd_),r.emitter.on("remove",this.onSubListRemove_),r.allItems().forEach(s=>{this.cache_.add(s)})),this.emitter.emit("add",{index:i,item:e,root:this,target:this})}remove(e){const t=this.items_.indexOf(e);if(t<0)return;this.items_.splice(t,1),this.cache_.delete(e);const i=this.extract_(e);i&&(i.allItems().forEach(r=>{this.cache_.delete(r)}),i.emitter.off("add",this.onSubListAdd_),i.emitter.off("remove",this.onSubListRemove_)),this.emitter.emit("remove",{index:t,item:e,root:this,target:this})}onSubListAdd_(e){this.cache_.add(e.item),this.emitter.emit("add",{index:e.index,item:e.item,root:this,target:e.target})}onSubListRemove_(e){this.cache_.delete(e.item),this.emitter.emit("remove",{index:e.index,item:e.item,root:this,target:e.target})}}function Ty(n,e){for(let t=0;t<n.length;t++){const i=n[t];if(wi(i)&&i.value===e)return i}return null}function Cy(n){return tl(n)?n.rackController.rack.bcSet_:null}class Ay{constructor(e){var t,i;this.emitter=new vt,this.onBladePositionsChange_=this.onBladePositionsChange_.bind(this),this.onSetAdd_=this.onSetAdd_.bind(this),this.onSetRemove_=this.onSetRemove_.bind(this),this.onChildDispose_=this.onChildDispose_.bind(this),this.onChildPositionsChange_=this.onChildPositionsChange_.bind(this),this.onChildValueChange_=this.onChildValueChange_.bind(this),this.onChildViewPropsChange_=this.onChildViewPropsChange_.bind(this),this.onRackLayout_=this.onRackLayout_.bind(this),this.onRackValueChange_=this.onRackValueChange_.bind(this),this.blade_=(t=e.blade)!==null&&t!==void 0?t:null,(i=this.blade_)===null||i===void 0||i.value("positions").emitter.on("change",this.onBladePositionsChange_),this.viewProps=e.viewProps,this.bcSet_=new Ey(Cy),this.bcSet_.emitter.on("add",this.onSetAdd_),this.bcSet_.emitter.on("remove",this.onSetRemove_)}get children(){return this.bcSet_.items}add(e,t){var i;(i=e.parent)===null||i===void 0||i.remove(e),e.parent=this,this.bcSet_.add(e,t)}remove(e){e.parent=null,this.bcSet_.remove(e)}find(e){return this.bcSet_.allItems().filter(e)}onSetAdd_(e){this.updatePositions_();const t=e.target===e.root;if(this.emitter.emit("add",{bladeController:e.item,index:e.index,root:t,sender:this}),!t)return;const i=e.item;if(i.viewProps.emitter.on("change",this.onChildViewPropsChange_),i.blade.value("positions").emitter.on("change",this.onChildPositionsChange_),i.viewProps.handleDispose(this.onChildDispose_),wi(i))i.value.emitter.on("change",this.onChildValueChange_);else if(tl(i)){const r=i.rackController.rack;if(r){const s=r.emitter;s.on("layout",this.onRackLayout_),s.on("valuechange",this.onRackValueChange_)}}}onSetRemove_(e){this.updatePositions_();const t=e.target===e.root;if(this.emitter.emit("remove",{bladeController:e.item,root:t,sender:this}),!t)return;const i=e.item;if(wi(i))i.value.emitter.off("change",this.onChildValueChange_);else if(tl(i)){const r=i.rackController.rack;if(r){const s=r.emitter;s.off("layout",this.onRackLayout_),s.off("valuechange",this.onRackValueChange_)}}}updatePositions_(){const e=this.bcSet_.items.filter(r=>!r.viewProps.get("hidden")),t=e[0],i=e[e.length-1];this.bcSet_.items.forEach(r=>{const s=[];r===t&&(s.push("first"),(!this.blade_||this.blade_.get("positions").includes("veryfirst"))&&s.push("veryfirst")),r===i&&(s.push("last"),(!this.blade_||this.blade_.get("positions").includes("verylast"))&&s.push("verylast")),r.blade.set("positions",s)})}onChildPositionsChange_(){this.updatePositions_(),this.emitter.emit("layout",{sender:this})}onChildViewPropsChange_(e){this.updatePositions_(),this.emitter.emit("layout",{sender:this})}onChildDispose_(){this.bcSet_.items.filter(t=>t.viewProps.get("disposed")).forEach(t=>{this.bcSet_.remove(t)})}onChildValueChange_(e){const t=Ty(this.find(wi),e.sender);if(!t)throw ht.alreadyDisposed();this.emitter.emit("valuechange",{bladeController:t,options:e.options,sender:this})}onRackLayout_(e){this.updatePositions_(),this.emitter.emit("layout",{sender:this})}onRackValueChange_(e){this.emitter.emit("valuechange",{bladeController:e.bladeController,options:e.options,sender:this})}onBladePositionsChange_(){this.updatePositions_()}}class Il{constructor(e){this.onRackAdd_=this.onRackAdd_.bind(this),this.onRackRemove_=this.onRackRemove_.bind(this),this.element=e.element,this.viewProps=e.viewProps;const t=new Ay({blade:e.root?void 0:e.blade,viewProps:e.viewProps});t.emitter.on("add",this.onRackAdd_),t.emitter.on("remove",this.onRackRemove_),this.rack=t,this.viewProps.handleDispose(()=>{for(let i=this.rack.children.length-1;i>=0;i--)this.rack.children[i].viewProps.set("disposed",!0)})}onRackAdd_(e){e.root&&Gu(this.element,e.bladeController.view.element,e.index)}onRackRemove_(e){e.root&&Pl(e.bladeController.view.element)}}function yr(){return new Ne({positions:st([],{equals:sb})})}class es extends Ne{constructor(e){super(e)}static create(e){const t={completed:!0,expanded:e,expandedHeight:null,shouldFixHeight:!1,temporaryExpanded:null},i=Ne.createCore(t);return new es(i)}get styleExpanded(){var e;return(e=this.get("temporaryExpanded"))!==null&&e!==void 0?e:this.get("expanded")}get styleHeight(){if(!this.styleExpanded)return"0";const e=this.get("expandedHeight");return this.get("shouldFixHeight")&&!tt(e)?`${e}px`:"auto"}bindExpandedClass(e,t){const i=()=>{this.styleExpanded?e.classList.add(t):e.classList.remove(t)};yn(this,"expanded",i),yn(this,"temporaryExpanded",i)}cleanUpTransition(){this.set("shouldFixHeight",!1),this.set("expandedHeight",null),this.set("completed",!0)}}function Py(n,e){let t=0;return Yb(e,()=>{n.set("expandedHeight",null),n.set("temporaryExpanded",!0),Zs(e),t=e.clientHeight,n.set("temporaryExpanded",null),Zs(e)}),t}function wh(n,e){e.style.height=n.styleHeight}function Ul(n,e){n.value("expanded").emitter.on("beforechange",()=>{if(n.set("completed",!1),tt(n.get("expandedHeight"))){const t=Py(n,e);t>0&&n.set("expandedHeight",t)}n.set("shouldFixHeight",!0),Zs(e)}),n.emitter.on("change",()=>{wh(n,e)}),wh(n,e),e.addEventListener("transitionend",t=>{t.propertyName==="height"&&n.cleanUpTransition()})}class Zu extends Dl{constructor(e,t){super(e,t),this.emitter_=new vt,this.controller.foldable.value("expanded").emitter.on("change",i=>{this.emitter_.emit("fold",new Vb(this,i.sender.rawValue))}),this.rackApi_.on("change",i=>{this.emitter_.emit("change",i)})}get expanded(){return this.controller.foldable.get("expanded")}set expanded(e){this.controller.foldable.set("expanded",e)}get title(){return this.controller.props.get("title")}set title(e){this.controller.props.set("title",e)}get children(){return this.rackApi_.children}addBinding(e,t,i){return this.rackApi_.addBinding(e,t,i)}addFolder(e){return this.rackApi_.addFolder(e)}addButton(e){return this.rackApi_.addButton(e)}addTab(e){return this.rackApi_.addTab(e)}add(e,t){return this.rackApi_.add(e,t)}remove(e){this.rackApi_.remove(e)}addBlade(e){return this.rackApi_.addBlade(e)}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}}const Ju=Ve("cnt");class Ry{constructor(e,t){var i;this.className_=Ve((i=t.viewName)!==null&&i!==void 0?i:"fld"),this.element=e.createElement("div"),this.element.classList.add(this.className_(),Ju()),t.viewProps.bindClassModifiers(this.element),this.foldable_=t.foldable,this.foldable_.bindExpandedClass(this.element,this.className_(void 0,"expanded")),yn(this.foldable_,"completed",xr(this.element,this.className_(void 0,"cpl")));const r=e.createElement("button");r.classList.add(this.className_("b")),yn(t.props,"title",c=>{tt(c)?this.element.classList.add(this.className_(void 0,"not")):this.element.classList.remove(this.className_(void 0,"not"))}),t.viewProps.bindDisabled(r),this.element.appendChild(r),this.buttonElement=r;const s=e.createElement("div");s.classList.add(this.className_("i")),this.element.appendChild(s);const a=e.createElement("div");a.classList.add(this.className_("t")),Rl(t.props.value("title"),a),this.buttonElement.appendChild(a),this.titleElement=a;const o=e.createElement("div");o.classList.add(this.className_("m")),this.buttonElement.appendChild(o);const l=e.createElement("div");l.classList.add(this.className_("c")),this.element.appendChild(l),this.containerElement=l}}class nl extends Ll{constructor(e,t){var i;const r=es.create((i=t.expanded)!==null&&i!==void 0?i:!0),s=new Ry(e,{foldable:r,props:t.props,viewName:t.root?"rot":void 0,viewProps:t.viewProps});super(Object.assign(Object.assign({},t),{rackController:new Il({blade:t.blade,element:s.containerElement,root:t.root,viewProps:t.viewProps}),view:s})),this.onTitleClick_=this.onTitleClick_.bind(this),this.props=t.props,this.foldable=r,Ul(this.foldable,this.view.containerElement),this.rackController.rack.emitter.on("add",()=>{this.foldable.cleanUpTransition()}),this.rackController.rack.emitter.on("remove",()=>{this.foldable.cleanUpTransition()}),this.view.buttonElement.addEventListener("click",this.onTitleClick_)}get document(){return this.view.element.ownerDocument}importState(e){return Jt(e,t=>super.importState(t),t=>({expanded:t.required.boolean,title:t.optional.string}),t=>(this.foldable.set("expanded",t.expanded),this.props.set("title",t.title),!0))}exportState(){return Qt(()=>super.exportState(),{expanded:this.foldable.get("expanded"),title:this.props.get("title")})}onTitleClick_(){this.foldable.set("expanded",!this.foldable.get("expanded"))}}const Dy=Ut({id:"folder",type:"blade",accept(n){const e=ot(n,t=>({title:t.required.string,view:t.required.constant("folder"),expanded:t.optional.boolean}));return e?{params:e}:null},controller(n){return new nl(n.document,{blade:n.blade,expanded:n.params.expanded,props:Ne.fromObject({title:n.params.title}),viewProps:n.viewProps})},api(n){return n.controller instanceof nl?new Zu(n.controller,n.pool):null}}),Ly=Ve("");function Sh(n,e){return xr(n,Ly(void 0,e))}class Vn extends Ne{constructor(e){var t;super(e),this.onDisabledChange_=this.onDisabledChange_.bind(this),this.onParentChange_=this.onParentChange_.bind(this),this.onParentGlobalDisabledChange_=this.onParentGlobalDisabledChange_.bind(this),[this.globalDisabled_,this.setGlobalDisabled_]=hb(st(this.getGlobalDisabled_())),this.value("disabled").emitter.on("change",this.onDisabledChange_),this.value("parent").emitter.on("change",this.onParentChange_),(t=this.get("parent"))===null||t===void 0||t.globalDisabled.emitter.on("change",this.onParentGlobalDisabledChange_)}static create(e){var t,i,r;const s=e??{};return new Vn(Ne.createCore({disabled:(t=s.disabled)!==null&&t!==void 0?t:!1,disposed:!1,hidden:(i=s.hidden)!==null&&i!==void 0?i:!1,parent:(r=s.parent)!==null&&r!==void 0?r:null}))}get globalDisabled(){return this.globalDisabled_}bindClassModifiers(e){On(this.globalDisabled_,Sh(e,"disabled")),yn(this,"hidden",Sh(e,"hidden"))}bindDisabled(e){On(this.globalDisabled_,t=>{e.disabled=t})}bindTabIndex(e){On(this.globalDisabled_,t=>{e.tabIndex=t?-1:0})}handleDispose(e){this.value("disposed").emitter.on("change",t=>{t&&e()})}importState(e){this.set("disabled",e.disabled),this.set("hidden",e.hidden)}exportState(){return{disabled:this.get("disabled"),hidden:this.get("hidden")}}getGlobalDisabled_(){const e=this.get("parent");return(e?e.globalDisabled.rawValue:!1)||this.get("disabled")}updateGlobalDisabled_(){this.setGlobalDisabled_(this.getGlobalDisabled_())}onDisabledChange_(){this.updateGlobalDisabled_()}onParentGlobalDisabledChange_(){this.updateGlobalDisabled_()}onParentChange_(e){var t;const i=e.previousRawValue;i?.globalDisabled.emitter.off("change",this.onParentGlobalDisabledChange_),(t=this.get("parent"))===null||t===void 0||t.globalDisabled.emitter.on("change",this.onParentGlobalDisabledChange_),this.updateGlobalDisabled_()}}const Mh=Ve("tbp");class Iy{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Mh()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add(Mh("c")),this.element.appendChild(i),this.containerElement=i}}const Nr=Ve("tbi");class Uy{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Nr()),t.viewProps.bindClassModifiers(this.element),yn(t.props,"selected",s=>{s?this.element.classList.add(Nr(void 0,"sel")):this.element.classList.remove(Nr(void 0,"sel"))});const i=e.createElement("button");i.classList.add(Nr("b")),t.viewProps.bindDisabled(i),this.element.appendChild(i),this.buttonElement=i;const r=e.createElement("div");r.classList.add(Nr("t")),Rl(t.props.value("title"),r),this.buttonElement.appendChild(r),this.titleElement=r}}class Ny{constructor(e,t){this.emitter=new vt,this.onClick_=this.onClick_.bind(this),this.props=t.props,this.viewProps=t.viewProps,this.view=new Uy(e,{props:t.props,viewProps:t.viewProps}),this.view.buttonElement.addEventListener("click",this.onClick_)}onClick_(){this.emitter.emit("click",{sender:this})}}class il extends Ll{constructor(e,t){const i=new Iy(e,{viewProps:t.viewProps});super(Object.assign(Object.assign({},t),{rackController:new Il({blade:t.blade,element:i.containerElement,viewProps:t.viewProps}),view:i})),this.onItemClick_=this.onItemClick_.bind(this),this.ic_=new Ny(e,{props:t.itemProps,viewProps:Vn.create()}),this.ic_.emitter.on("click",this.onItemClick_),this.props=t.props,yn(this.props,"selected",r=>{this.itemController.props.set("selected",r),this.viewProps.set("hidden",!r)})}get itemController(){return this.ic_}importState(e){return Jt(e,t=>super.importState(t),t=>({selected:t.required.boolean,title:t.required.string}),t=>(this.ic_.props.set("selected",t.selected),this.ic_.props.set("title",t.title),!0))}exportState(){return Qt(()=>super.exportState(),{selected:this.ic_.props.get("selected"),title:this.ic_.props.get("title")})}onItemClick_(){this.props.set("selected",!0)}}class Fy extends Dl{constructor(e,t){super(e,t),this.emitter_=new vt,this.onSelect_=this.onSelect_.bind(this),this.pool_=t,this.rackApi_.on("change",i=>{this.emitter_.emit("change",i)}),this.controller.tab.selectedIndex.emitter.on("change",this.onSelect_)}get pages(){return this.rackApi_.children}addPage(e){const t=this.controller.view.element.ownerDocument,i=new il(t,{blade:yr(),itemProps:Ne.fromObject({selected:!1,title:e.title}),props:Ne.fromObject({selected:!1}),viewProps:Vn.create()}),r=this.pool_.createApi(i);return this.rackApi_.add(r,e.index)}removePage(e){this.rackApi_.remove(this.rackApi_.children[e])}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}onSelect_(e){this.emitter_.emit("select",new Hb(this,e.rawValue))}}class Oy extends Dl{get title(){var e;return(e=this.controller.itemController.props.get("title"))!==null&&e!==void 0?e:""}set title(e){this.controller.itemController.props.set("title",e)}get selected(){return this.controller.props.get("selected")}set selected(e){this.controller.props.set("selected",e)}get children(){return this.rackApi_.children}addButton(e){return this.rackApi_.addButton(e)}addFolder(e){return this.rackApi_.addFolder(e)}addTab(e){return this.rackApi_.addTab(e)}add(e,t){this.rackApi_.add(e,t)}remove(e){this.rackApi_.remove(e)}addBinding(e,t,i){return this.rackApi_.addBinding(e,t,i)}addBlade(e){return this.rackApi_.addBlade(e)}}const Eh=-1;class ky{constructor(){this.onItemSelectedChange_=this.onItemSelectedChange_.bind(this),this.empty=st(!0),this.selectedIndex=st(Eh),this.items_=[]}add(e,t){const i=t??this.items_.length;this.items_.splice(i,0,e),e.emitter.on("change",this.onItemSelectedChange_),this.keepSelection_()}remove(e){const t=this.items_.indexOf(e);t<0||(this.items_.splice(t,1),e.emitter.off("change",this.onItemSelectedChange_),this.keepSelection_())}keepSelection_(){if(this.items_.length===0){this.selectedIndex.rawValue=Eh,this.empty.rawValue=!0;return}const e=this.items_.findIndex(t=>t.rawValue);e<0?(this.items_.forEach((t,i)=>{t.rawValue=i===0}),this.selectedIndex.rawValue=0):(this.items_.forEach((t,i)=>{t.rawValue=i===e}),this.selectedIndex.rawValue=e),this.empty.rawValue=!1}onItemSelectedChange_(e){if(e.rawValue){const t=this.items_.findIndex(i=>i===e.sender);this.items_.forEach((i,r)=>{i.rawValue=r===t}),this.selectedIndex.rawValue=t}else this.keepSelection_()}}const Fr=Ve("tab");class By{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Fr(),Ju()),t.viewProps.bindClassModifiers(this.element),On(t.empty,xr(this.element,Fr(void 0,"nop")));const i=e.createElement("div");i.classList.add(Fr("t")),this.element.appendChild(i),this.itemsElement=i;const r=e.createElement("div");r.classList.add(Fr("i")),this.element.appendChild(r);const s=e.createElement("div");s.classList.add(Fr("c")),this.element.appendChild(s),this.contentsElement=s}}class Th extends Ll{constructor(e,t){const i=new ky,r=new By(e,{empty:i.empty,viewProps:t.viewProps});super({blade:t.blade,rackController:new Il({blade:t.blade,element:r.contentsElement,viewProps:t.viewProps}),view:r}),this.onRackAdd_=this.onRackAdd_.bind(this),this.onRackRemove_=this.onRackRemove_.bind(this);const s=this.rackController.rack;s.emitter.on("add",this.onRackAdd_),s.emitter.on("remove",this.onRackRemove_),this.tab=i}add(e,t){this.rackController.rack.add(e,t)}remove(e){this.rackController.rack.remove(this.rackController.rack.children[e])}onRackAdd_(e){if(!e.root)return;const t=e.bladeController;Gu(this.view.itemsElement,t.itemController.view.element,e.index),t.itemController.viewProps.set("parent",this.viewProps),this.tab.add(t.props.value("selected"))}onRackRemove_(e){if(!e.root)return;const t=e.bladeController;Pl(t.itemController.view.element),t.itemController.viewProps.set("parent",null),this.tab.remove(t.props.value("selected"))}}const Qu=Ut({id:"tab",type:"blade",accept(n){const e=ot(n,t=>({pages:t.required.array(t.required.object({title:t.required.string})),view:t.required.constant("tab")}));return!e||e.pages.length===0?null:{params:e}},controller(n){const e=new Th(n.document,{blade:n.blade,viewProps:n.viewProps});return n.params.pages.forEach(t=>{const i=new il(n.document,{blade:yr(),itemProps:Ne.fromObject({selected:!1,title:t.title}),props:Ne.fromObject({selected:!1}),viewProps:Vn.create()});e.add(i)}),e},api(n){return n.controller instanceof Th?new Fy(n.controller,n.pool):n.controller instanceof il?new Oy(n.controller,n.pool):null}});function zy(n,e){const t=n.accept(e.params);if(!t)return null;const i=ot(e.params,r=>({disabled:r.optional.boolean,hidden:r.optional.boolean}));return n.controller({blade:yr(),document:e.document,params:Object.assign(Object.assign({},t.params),{disabled:i?.disabled,hidden:i?.hidden}),viewProps:Vn.create({disabled:i?.disabled,hidden:i?.hidden})})}class Nl extends Wr{get options(){return this.controller.valueController.props.get("options")}set options(e){this.controller.valueController.props.set("options",e)}}class Vy{constructor(){this.disabled=!1,this.emitter=new vt}dispose(){}tick(){this.disabled||this.emitter.emit("tick",{sender:this})}}class Hy{constructor(e,t){this.disabled_=!1,this.timerId_=null,this.onTick_=this.onTick_.bind(this),this.doc_=e,this.emitter=new vt,this.interval_=t,this.setTimer_()}get disabled(){return this.disabled_}set disabled(e){this.disabled_=e,this.disabled_?this.clearTimer_():this.setTimer_()}dispose(){this.clearTimer_()}clearTimer_(){if(this.timerId_===null)return;const e=this.doc_.defaultView;e&&e.clearInterval(this.timerId_),this.timerId_=null}setTimer_(){if(this.clearTimer_(),this.interval_<=0)return;const e=this.doc_.defaultView;e&&(this.timerId_=e.setInterval(this.onTick_,this.interval_))}onTick_(){this.disabled_||this.emitter.emit("tick",{sender:this})}}class ts{constructor(e){this.constraints=e}constrain(e){return this.constraints.reduce((t,i)=>i.constrain(t),e)}}function Js(n,e){if(n instanceof e)return n;if(n instanceof ts){const t=n.constraints.reduce((i,r)=>i||(r instanceof e?r:null),null);if(t)return t}return null}class ns{constructor(e){this.values=Ne.fromObject({options:e})}constrain(e){const t=this.values.get("options");return t.length===0||t.filter(r=>r.value===e).length>0?e:t[0].value}}function is(n){var e;const t=el;if(Array.isArray(n))return(e=ot({items:n},i=>({items:i.required.array(i.required.object({text:i.required.string,value:i.required.raw}))})))===null||e===void 0?void 0:e.items;if(typeof n=="object")return t.required.raw(n).value}function Fl(n){if(Array.isArray(n))return n;const e=[];return Object.keys(n).forEach(t=>{e.push({text:t,value:n[t]})}),e}function Ol(n){return tt(n)?null:new ns(Fl(n))}const io=Ve("lst");class Gy{constructor(e,t){this.onValueChange_=this.onValueChange_.bind(this),this.props_=t.props,this.element=e.createElement("div"),this.element.classList.add(io()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("select");i.classList.add(io("s")),t.viewProps.bindDisabled(i),this.element.appendChild(i),this.selectElement=i;const r=e.createElement("div");r.classList.add(io("m")),r.appendChild(pa(e,"dropdown")),this.element.appendChild(r),t.value.emitter.on("change",this.onValueChange_),this.value_=t.value,yn(this.props_,"options",s=>{Wu(this.selectElement),s.forEach(a=>{const o=e.createElement("option");o.textContent=a.text,this.selectElement.appendChild(o)}),this.update_()})}update_(){const e=this.props_.get("options").map(t=>t.value);this.selectElement.selectedIndex=e.indexOf(this.value_.rawValue)}onValueChange_(){this.update_()}}class ri{constructor(e,t){this.onSelectChange_=this.onSelectChange_.bind(this),this.props=t.props,this.value=t.value,this.viewProps=t.viewProps,this.view=new Gy(e,{props:this.props,value:this.value,viewProps:this.viewProps}),this.view.selectElement.addEventListener("change",this.onSelectChange_)}onSelectChange_(e){const t=e.currentTarget;this.value.rawValue=this.props.get("options")[t.selectedIndex].value}importProps(e){return Jt(e,null,t=>({options:t.required.custom(is)}),t=>(this.props.set("options",Fl(t.options)),!0))}exportProps(){return Qt(null,{options:this.props.get("options")})}}const Ch=Ve("pop");class Wy{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Ch()),t.viewProps.bindClassModifiers(this.element),On(t.shows,xr(this.element,Ch(void 0,"v")))}}class ed{constructor(e,t){this.shows=st(!1),this.viewProps=t.viewProps,this.view=new Wy(e,{shows:this.shows,viewProps:this.viewProps})}}const Ah=Ve("txt");class Xy{constructor(e,t){this.onChange_=this.onChange_.bind(this),this.element=e.createElement("div"),this.element.classList.add(Ah()),t.viewProps.bindClassModifiers(this.element),this.props_=t.props,this.props_.emitter.on("change",this.onChange_);const i=e.createElement("input");i.classList.add(Ah("i")),i.type="text",t.viewProps.bindDisabled(i),this.element.appendChild(i),this.inputElement=i,t.value.emitter.on("change",this.onChange_),this.value_=t.value,this.refresh()}refresh(){const e=this.props_.get("formatter");this.inputElement.value=e(this.value_.rawValue)}onChange_(){this.refresh()}}class Xr{constructor(e,t){this.onInputChange_=this.onInputChange_.bind(this),this.parser_=t.parser,this.props=t.props,this.value=t.value,this.viewProps=t.viewProps,this.view=new Xy(e,{props:t.props,value:this.value,viewProps:this.viewProps}),this.view.inputElement.addEventListener("change",this.onInputChange_)}onInputChange_(e){const i=e.currentTarget.value,r=this.parser_(i);tt(r)||(this.value.rawValue=r),this.view.refresh()}}function jy(n){return String(n)}function td(n){return n==="false"?!1:!!n}function Ph(n){return jy(n)}function Ky(n){return e=>n.reduce((t,i)=>t!==null?t:i(e),null)}const qy=Ht(0);function Qs(n){return qy(n)+"%"}function nd(n){return String(n)}function rl(n){return n}function wr({primary:n,secondary:e,forward:t,backward:i}){let r=!1;function s(a){r||(r=!0,a(),r=!1)}n.emitter.on("change",a=>{s(()=>{e.setRawValue(t(n.rawValue,e.rawValue),a.options)})}),e.emitter.on("change",a=>{s(()=>{n.setRawValue(i(n.rawValue,e.rawValue),a.options)}),s(()=>{e.setRawValue(t(n.rawValue,e.rawValue),a.options)})}),s(()=>{e.setRawValue(t(n.rawValue,e.rawValue),{forceEmit:!1,last:!0})})}function Bt(n,e){const t=n*(e.altKey?.1:1)*(e.shiftKey?10:1);return e.upKey?+t:e.downKey?-t:0}function jr(n){return{altKey:n.altKey,downKey:n.key==="ArrowDown",shiftKey:n.shiftKey,upKey:n.key==="ArrowUp"}}function zn(n){return{altKey:n.altKey,downKey:n.key==="ArrowLeft",shiftKey:n.shiftKey,upKey:n.key==="ArrowRight"}}function Yy(n){return n==="ArrowUp"||n==="ArrowDown"}function id(n){return Yy(n)||n==="ArrowLeft"||n==="ArrowRight"}function ro(n,e){var t,i;const r=e.ownerDocument.defaultView,s=e.getBoundingClientRect();return{x:n.pageX-(((t=r&&r.scrollX)!==null&&t!==void 0?t:0)+s.left),y:n.pageY-(((i=r&&r.scrollY)!==null&&i!==void 0?i:0)+s.top)}}class Li{constructor(e){this.lastTouch_=null,this.onDocumentMouseMove_=this.onDocumentMouseMove_.bind(this),this.onDocumentMouseUp_=this.onDocumentMouseUp_.bind(this),this.onMouseDown_=this.onMouseDown_.bind(this),this.onTouchEnd_=this.onTouchEnd_.bind(this),this.onTouchMove_=this.onTouchMove_.bind(this),this.onTouchStart_=this.onTouchStart_.bind(this),this.elem_=e,this.emitter=new vt,e.addEventListener("touchstart",this.onTouchStart_,{passive:!1}),e.addEventListener("touchmove",this.onTouchMove_,{passive:!0}),e.addEventListener("touchend",this.onTouchEnd_),e.addEventListener("mousedown",this.onMouseDown_)}computePosition_(e){const t=this.elem_.getBoundingClientRect();return{bounds:{width:t.width,height:t.height},point:e?{x:e.x,y:e.y}:null}}onMouseDown_(e){var t;e.preventDefault(),(t=e.currentTarget)===null||t===void 0||t.focus();const i=this.elem_.ownerDocument;i.addEventListener("mousemove",this.onDocumentMouseMove_),i.addEventListener("mouseup",this.onDocumentMouseUp_),this.emitter.emit("down",{altKey:e.altKey,data:this.computePosition_(ro(e,this.elem_)),sender:this,shiftKey:e.shiftKey})}onDocumentMouseMove_(e){this.emitter.emit("move",{altKey:e.altKey,data:this.computePosition_(ro(e,this.elem_)),sender:this,shiftKey:e.shiftKey})}onDocumentMouseUp_(e){const t=this.elem_.ownerDocument;t.removeEventListener("mousemove",this.onDocumentMouseMove_),t.removeEventListener("mouseup",this.onDocumentMouseUp_),this.emitter.emit("up",{altKey:e.altKey,data:this.computePosition_(ro(e,this.elem_)),sender:this,shiftKey:e.shiftKey})}onTouchStart_(e){e.preventDefault();const t=e.targetTouches.item(0),i=this.elem_.getBoundingClientRect();this.emitter.emit("down",{altKey:e.altKey,data:this.computePosition_(t?{x:t.clientX-i.left,y:t.clientY-i.top}:void 0),sender:this,shiftKey:e.shiftKey}),this.lastTouch_=t}onTouchMove_(e){const t=e.targetTouches.item(0),i=this.elem_.getBoundingClientRect();this.emitter.emit("move",{altKey:e.altKey,data:this.computePosition_(t?{x:t.clientX-i.left,y:t.clientY-i.top}:void 0),sender:this,shiftKey:e.shiftKey}),this.lastTouch_=t}onTouchEnd_(e){var t;const i=(t=e.targetTouches.item(0))!==null&&t!==void 0?t:this.lastTouch_,r=this.elem_.getBoundingClientRect();this.emitter.emit("up",{altKey:e.altKey,data:this.computePosition_(i?{x:i.clientX-r.left,y:i.clientY-r.top}:void 0),sender:this,shiftKey:e.shiftKey})}}const nn=Ve("txt");class $y{constructor(e,t){this.onChange_=this.onChange_.bind(this),this.props_=t.props,this.props_.emitter.on("change",this.onChange_),this.element=e.createElement("div"),this.element.classList.add(nn(),nn(void 0,"num")),t.arrayPosition&&this.element.classList.add(nn(void 0,t.arrayPosition)),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("input");i.classList.add(nn("i")),i.type="text",t.viewProps.bindDisabled(i),this.element.appendChild(i),this.inputElement=i,this.onDraggingChange_=this.onDraggingChange_.bind(this),this.dragging_=t.dragging,this.dragging_.emitter.on("change",this.onDraggingChange_),this.element.classList.add(nn()),this.inputElement.classList.add(nn("i"));const r=e.createElement("div");r.classList.add(nn("k")),this.element.appendChild(r),this.knobElement=r;const s=e.createElementNS(gn,"svg");s.classList.add(nn("g")),this.knobElement.appendChild(s);const a=e.createElementNS(gn,"path");a.classList.add(nn("gb")),s.appendChild(a),this.guideBodyElem_=a;const o=e.createElementNS(gn,"path");o.classList.add(nn("gh")),s.appendChild(o),this.guideHeadElem_=o;const l=e.createElement("div");l.classList.add(Ve("tt")()),this.knobElement.appendChild(l),this.tooltipElem_=l,t.value.emitter.on("change",this.onChange_),this.value=t.value,this.refresh()}onDraggingChange_(e){if(e.rawValue===null){this.element.classList.remove(nn(void 0,"drg"));return}this.element.classList.add(nn(void 0,"drg"));const t=e.rawValue/this.props_.get("pointerScale"),i=t+(t>0?-1:t<0?1:0),r=xt(-i,-4,4);this.guideHeadElem_.setAttributeNS(null,"d",[`M ${i+r},0 L${i},4 L${i+r},8`,`M ${t},-1 L${t},9`].join(" ")),this.guideBodyElem_.setAttributeNS(null,"d",`M 0,4 L${t},4`);const s=this.props_.get("formatter");this.tooltipElem_.textContent=s(this.value.rawValue),this.tooltipElem_.style.left=`${t}px`}refresh(){const e=this.props_.get("formatter");this.inputElement.value=e(this.value.rawValue)}onChange_(){this.refresh()}}class rs{constructor(e,t){var i;this.originRawValue_=0,this.onInputChange_=this.onInputChange_.bind(this),this.onInputKeyDown_=this.onInputKeyDown_.bind(this),this.onInputKeyUp_=this.onInputKeyUp_.bind(this),this.onPointerDown_=this.onPointerDown_.bind(this),this.onPointerMove_=this.onPointerMove_.bind(this),this.onPointerUp_=this.onPointerUp_.bind(this),this.parser_=t.parser,this.props=t.props,this.sliderProps_=(i=t.sliderProps)!==null&&i!==void 0?i:null,this.value=t.value,this.viewProps=t.viewProps,this.dragging_=st(null),this.view=new $y(e,{arrayPosition:t.arrayPosition,dragging:this.dragging_,props:this.props,value:this.value,viewProps:this.viewProps}),this.view.inputElement.addEventListener("change",this.onInputChange_),this.view.inputElement.addEventListener("keydown",this.onInputKeyDown_),this.view.inputElement.addEventListener("keyup",this.onInputKeyUp_);const r=new Li(this.view.knobElement);r.emitter.on("down",this.onPointerDown_),r.emitter.on("move",this.onPointerMove_),r.emitter.on("up",this.onPointerUp_)}constrainValue_(e){var t,i;const r=(t=this.sliderProps_)===null||t===void 0?void 0:t.get("min"),s=(i=this.sliderProps_)===null||i===void 0?void 0:i.get("max");let a=e;return r!==void 0&&(a=Math.max(a,r)),s!==void 0&&(a=Math.min(a,s)),a}onInputChange_(e){const i=e.currentTarget.value,r=this.parser_(i);tt(r)||(this.value.rawValue=this.constrainValue_(r)),this.view.refresh()}onInputKeyDown_(e){const t=Bt(this.props.get("keyScale"),jr(e));t!==0&&this.value.setRawValue(this.constrainValue_(this.value.rawValue+t),{forceEmit:!1,last:!1})}onInputKeyUp_(e){Bt(this.props.get("keyScale"),jr(e))!==0&&this.value.setRawValue(this.value.rawValue,{forceEmit:!0,last:!0})}onPointerDown_(){this.originRawValue_=this.value.rawValue,this.dragging_.rawValue=0}computeDraggingValue_(e){if(!e.point)return null;const t=e.point.x-e.bounds.width/2;return this.constrainValue_(this.originRawValue_+t*this.props.get("pointerScale"))}onPointerMove_(e){const t=this.computeDraggingValue_(e.data);t!==null&&(this.value.setRawValue(t,{forceEmit:!1,last:!1}),this.dragging_.rawValue=this.value.rawValue-this.originRawValue_)}onPointerUp_(e){const t=this.computeDraggingValue_(e.data);t!==null&&(this.value.setRawValue(t,{forceEmit:!0,last:!0}),this.dragging_.rawValue=null)}}const so=Ve("sld");class Zy{constructor(e,t){this.onChange_=this.onChange_.bind(this),this.props_=t.props,this.props_.emitter.on("change",this.onChange_),this.element=e.createElement("div"),this.element.classList.add(so()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add(so("t")),t.viewProps.bindTabIndex(i),this.element.appendChild(i),this.trackElement=i;const r=e.createElement("div");r.classList.add(so("k")),this.trackElement.appendChild(r),this.knobElement=r,t.value.emitter.on("change",this.onChange_),this.value=t.value,this.update_()}update_(){const e=xt(Ye(this.value.rawValue,this.props_.get("min"),this.props_.get("max"),0,100),0,100);this.knobElement.style.width=`${e}%`}onChange_(){this.update_()}}class Jy{constructor(e,t){this.onKeyDown_=this.onKeyDown_.bind(this),this.onKeyUp_=this.onKeyUp_.bind(this),this.onPointerDownOrMove_=this.onPointerDownOrMove_.bind(this),this.onPointerUp_=this.onPointerUp_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.props=t.props,this.view=new Zy(e,{props:this.props,value:this.value,viewProps:this.viewProps}),this.ptHandler_=new Li(this.view.trackElement),this.ptHandler_.emitter.on("down",this.onPointerDownOrMove_),this.ptHandler_.emitter.on("move",this.onPointerDownOrMove_),this.ptHandler_.emitter.on("up",this.onPointerUp_),this.view.trackElement.addEventListener("keydown",this.onKeyDown_),this.view.trackElement.addEventListener("keyup",this.onKeyUp_)}handlePointerEvent_(e,t){e.point&&this.value.setRawValue(Ye(xt(e.point.x,0,e.bounds.width),0,e.bounds.width,this.props.get("min"),this.props.get("max")),t)}onPointerDownOrMove_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerUp_(e){this.handlePointerEvent_(e.data,{forceEmit:!0,last:!0})}onKeyDown_(e){const t=Bt(this.props.get("keyScale"),zn(e));t!==0&&this.value.setRawValue(this.value.rawValue+t,{forceEmit:!1,last:!1})}onKeyUp_(e){Bt(this.props.get("keyScale"),zn(e))!==0&&this.value.setRawValue(this.value.rawValue,{forceEmit:!0,last:!0})}}const ao=Ve("sldtxt");class Qy{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(ao());const i=e.createElement("div");i.classList.add(ao("s")),this.sliderView_=t.sliderView,i.appendChild(this.sliderView_.element),this.element.appendChild(i);const r=e.createElement("div");r.classList.add(ao("t")),this.textView_=t.textView,r.appendChild(this.textView_.element),this.element.appendChild(r)}}class ea{constructor(e,t){this.value=t.value,this.viewProps=t.viewProps,this.sliderC_=new Jy(e,{props:t.sliderProps,value:t.value,viewProps:this.viewProps}),this.textC_=new rs(e,{parser:t.parser,props:t.textProps,sliderProps:t.sliderProps,value:t.value,viewProps:t.viewProps}),this.view=new Qy(e,{sliderView:this.sliderC_.view,textView:this.textC_.view})}get sliderController(){return this.sliderC_}get textController(){return this.textC_}importProps(e){return Jt(e,null,t=>({max:t.required.number,min:t.required.number}),t=>{const i=this.sliderC_.props;return i.set("max",t.max),i.set("min",t.min),!0})}exportProps(){const e=this.sliderC_.props;return Qt(null,{max:e.get("max"),min:e.get("min")})}}function rd(n){return{sliderProps:new Ne({keyScale:n.keyScale,max:n.max,min:n.min}),textProps:new Ne({formatter:st(n.formatter),keyScale:n.keyScale,pointerScale:st(n.pointerScale)})}}const ew={containerUnitSize:"cnt-usz"};function sd(n){return`--${ew[n]}`}function Kr(n){return Vu(n)}function Qn(n){if(Qo(n))return ot(n,Kr)}function Nn(n,e){if(!n)return;const t=[],i=ku(n,e);i&&t.push(i);const r=Bu(n);return r&&t.push(r),new ts(t)}function tw(n){return n?n.major===br.major:!1}function ad(n){if(n==="inline"||n==="popup")return n}function ss(n,e){n.write(e)}const Us=Ve("ckb");class nw{constructor(e,t){this.onValueChange_=this.onValueChange_.bind(this),this.element=e.createElement("div"),this.element.classList.add(Us()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("label");i.classList.add(Us("l")),this.element.appendChild(i),this.labelElement=i;const r=e.createElement("input");r.classList.add(Us("i")),r.type="checkbox",this.labelElement.appendChild(r),this.inputElement=r,t.viewProps.bindDisabled(this.inputElement);const s=e.createElement("div");s.classList.add(Us("w")),this.labelElement.appendChild(s);const a=pa(e,"check");s.appendChild(a),t.value.emitter.on("change",this.onValueChange_),this.value=t.value,this.update_()}update_(){this.inputElement.checked=this.value.rawValue}onValueChange_(){this.update_()}}class iw{constructor(e,t){this.onInputChange_=this.onInputChange_.bind(this),this.onLabelMouseDown_=this.onLabelMouseDown_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.view=new nw(e,{value:this.value,viewProps:this.viewProps}),this.view.inputElement.addEventListener("change",this.onInputChange_),this.view.labelElement.addEventListener("mousedown",this.onLabelMouseDown_)}onInputChange_(e){const t=e.currentTarget;this.value.rawValue=t.checked,e.preventDefault(),e.stopPropagation()}onLabelMouseDown_(e){e.preventDefault()}}function rw(n){const e=[],t=Ol(n.options);return t&&e.push(t),new ts(e)}const sw=Ut({id:"input-bool",type:"input",accept:(n,e)=>{if(typeof n!="boolean")return null;const t=ot(e,i=>({options:i.optional.custom(is),readonly:i.optional.constant(!1)}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>td,constraint:n=>rw(n.params),writer:n=>ss},controller:n=>{const e=n.document,t=n.value,i=n.constraint,r=i&&Js(i,ns);return r?new ri(e,{props:new Ne({options:r.values.value("options")}),value:t,viewProps:n.viewProps}):new iw(e,{value:t,viewProps:n.viewProps})},api(n){return typeof n.controller.value.rawValue!="boolean"?null:n.controller.valueController instanceof ri?new Nl(n.controller):null}}),vi=Ve("col");class aw{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(vi()),t.foldable.bindExpandedClass(this.element,vi(void 0,"expanded")),yn(t.foldable,"completed",xr(this.element,vi(void 0,"cpl")));const i=e.createElement("div");i.classList.add(vi("h")),this.element.appendChild(i);const r=e.createElement("div");r.classList.add(vi("s")),i.appendChild(r),this.swatchElement=r;const s=e.createElement("div");if(s.classList.add(vi("t")),i.appendChild(s),this.textElement=s,t.pickerLayout==="inline"){const a=e.createElement("div");a.classList.add(vi("p")),this.element.appendChild(a),this.pickerElement=a}else this.pickerElement=null}}function ow(n,e,t){const i=xt(n/255,0,1),r=xt(e/255,0,1),s=xt(t/255,0,1),a=Math.max(i,r,s),o=Math.min(i,r,s),l=a-o;let c=0,h=0;const u=(o+a)/2;return l!==0&&(h=l/(1-Math.abs(a+o-1)),i===a?c=(r-s)/l:r===a?c=2+(s-i)/l:c=4+(i-r)/l,c=c/6+(c<0?1:0)),[c*360,h*100,u*100]}function lw(n,e,t){const i=(n%360+360)%360,r=xt(e/100,0,1),s=xt(t/100,0,1),a=(1-Math.abs(2*s-1))*r,o=a*(1-Math.abs(i/60%2-1)),l=s-a/2;let c,h,u;return i>=0&&i<60?[c,h,u]=[a,o,0]:i>=60&&i<120?[c,h,u]=[o,a,0]:i>=120&&i<180?[c,h,u]=[0,a,o]:i>=180&&i<240?[c,h,u]=[0,o,a]:i>=240&&i<300?[c,h,u]=[o,0,a]:[c,h,u]=[a,0,o],[(c+l)*255,(h+l)*255,(u+l)*255]}function cw(n,e,t){const i=xt(n/255,0,1),r=xt(e/255,0,1),s=xt(t/255,0,1),a=Math.max(i,r,s),o=Math.min(i,r,s),l=a-o;let c;l===0?c=0:a===i?c=60*(((r-s)/l%6+6)%6):a===r?c=60*((s-i)/l+2):c=60*((i-r)/l+4);const h=a===0?0:l/a,u=a;return[c,h*100,u*100]}function od(n,e,t){const i=Nu(n,360),r=xt(e/100,0,1),s=xt(t/100,0,1),a=s*r,o=a*(1-Math.abs(i/60%2-1)),l=s-a;let c,h,u;return i>=0&&i<60?[c,h,u]=[a,o,0]:i>=60&&i<120?[c,h,u]=[o,a,0]:i>=120&&i<180?[c,h,u]=[0,a,o]:i>=180&&i<240?[c,h,u]=[0,o,a]:i>=240&&i<300?[c,h,u]=[o,0,a]:[c,h,u]=[a,0,o],[(c+l)*255,(h+l)*255,(u+l)*255]}function hw(n,e,t){const i=t+e*(100-Math.abs(2*t-100))/200;return[n,i!==0?e*(100-Math.abs(2*t-100))/i:0,t+e*(100-Math.abs(2*t-100))/(2*100)]}function uw(n,e,t){const i=100-Math.abs(t*(200-e)/100-100);return[n,i!==0?e*t/i:0,t*(200-e)/(2*100)]}function wn(n){return[n[0],n[1],n[2]]}function ma(n,e){return[n[0],n[1],n[2],e]}const dw={hsl:{hsl:(n,e,t)=>[n,e,t],hsv:hw,rgb:lw},hsv:{hsl:uw,hsv:(n,e,t)=>[n,e,t],rgb:od},rgb:{hsl:ow,hsv:cw,rgb:(n,e,t)=>[n,e,t]}};function vr(n,e){return[e==="float"?1:n==="rgb"?255:360,e==="float"?1:n==="rgb"?255:100,e==="float"?1:n==="rgb"?255:100]}function pw(n,e){return n===e?e:Nu(n,e)}function ld(n,e,t){var i;const r=vr(e,t);return[e==="rgb"?xt(n[0],0,r[0]):pw(n[0],r[0]),xt(n[1],0,r[1]),xt(n[2],0,r[2]),xt((i=n[3])!==null&&i!==void 0?i:1,0,1)]}function Rh(n,e,t,i){const r=vr(e,t),s=vr(e,i);return n.map((a,o)=>a/r[o]*s[o])}function cd(n,e,t){const i=Rh(n,e.mode,e.type,"int"),r=dw[e.mode][t.mode](...i);return Rh(r,t.mode,"int",t.type)}class We{static black(){return new We([0,0,0],"rgb")}constructor(e,t){this.type="int",this.mode=t,this.comps_=ld(e,t,this.type)}getComponents(e){return ma(cd(wn(this.comps_),{mode:this.mode,type:this.type},{mode:e??this.mode,type:this.type}),this.comps_[3])}toRgbaObject(){const e=this.getComponents("rgb");return{r:e[0],g:e[1],b:e[2],a:e[3]}}}const Yn=Ve("colp");class fw{constructor(e,t){this.alphaViews_=null,this.element=e.createElement("div"),this.element.classList.add(Yn()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add(Yn("hsv"));const r=e.createElement("div");r.classList.add(Yn("sv")),this.svPaletteView_=t.svPaletteView,r.appendChild(this.svPaletteView_.element),i.appendChild(r);const s=e.createElement("div");s.classList.add(Yn("h")),this.hPaletteView_=t.hPaletteView,s.appendChild(this.hPaletteView_.element),i.appendChild(s),this.element.appendChild(i);const a=e.createElement("div");if(a.classList.add(Yn("rgb")),this.textsView_=t.textsView,a.appendChild(this.textsView_.element),this.element.appendChild(a),t.alphaViews){this.alphaViews_={palette:t.alphaViews.palette,text:t.alphaViews.text};const o=e.createElement("div");o.classList.add(Yn("a"));const l=e.createElement("div");l.classList.add(Yn("ap")),l.appendChild(this.alphaViews_.palette.element),o.appendChild(l);const c=e.createElement("div");c.classList.add(Yn("at")),c.appendChild(this.alphaViews_.text.element),o.appendChild(c),this.element.appendChild(o)}}get allFocusableElements(){const e=[this.svPaletteView_.element,this.hPaletteView_.element,this.textsView_.modeSelectElement,...this.textsView_.inputViews.map(t=>t.inputElement)];return this.alphaViews_&&e.push(this.alphaViews_.palette.element,this.alphaViews_.text.inputElement),e}}function mw(n){return n==="int"?"int":n==="float"?"float":void 0}function kl(n){return ot(n,e=>({color:e.optional.object({alpha:e.optional.boolean,type:e.optional.custom(mw)}),expanded:e.optional.boolean,picker:e.optional.custom(ad),readonly:e.optional.constant(!1)}))}function Ci(n){return n?.1:1}function hd(n){var e;return(e=n.color)===null||e===void 0?void 0:e.type}class Bl{constructor(e,t){this.type="float",this.mode=t,this.comps_=ld(e,t,this.type)}getComponents(e){return ma(cd(wn(this.comps_),{mode:this.mode,type:this.type},{mode:e??this.mode,type:this.type}),this.comps_[3])}toRgbaObject(){const e=this.getComponents("rgb");return{r:e[0],g:e[1],b:e[2],a:e[3]}}}const vw={int:(n,e)=>new We(n,e),float:(n,e)=>new Bl(n,e)};function zl(n,e,t){return vw[t](n,e)}function gw(n){return n.type==="float"}function _w(n){return n.type==="int"}function xw(n){const e=n.getComponents(),t=vr(n.mode,"int");return new We([Math.round(Ye(e[0],0,1,0,t[0])),Math.round(Ye(e[1],0,1,0,t[1])),Math.round(Ye(e[2],0,1,0,t[2])),e[3]],n.mode)}function bw(n){const e=n.getComponents(),t=vr(n.mode,"int");return new Bl([Ye(e[0],0,t[0],0,1),Ye(e[1],0,t[1],0,1),Ye(e[2],0,t[2],0,1),e[3]],n.mode)}function It(n,e){if(n.type===e)return n;if(_w(n)&&e==="float")return bw(n);if(gw(n)&&e==="int")return xw(n);throw ht.shouldNeverHappen()}function yw(n,e){return n.alpha===e.alpha&&n.mode===e.mode&&n.notation===e.notation&&n.type===e.type}function an(n,e){const t=n.match(/^(.+)%$/);return Math.min(t?parseFloat(t[1])*.01*e:parseFloat(n),e)}const ww={deg:n=>n,grad:n=>n*360/400,rad:n=>n*360/(2*Math.PI),turn:n=>n*360};function ud(n){const e=n.match(/^([0-9.]+?)(deg|grad|rad|turn)$/);if(!e)return parseFloat(n);const t=parseFloat(e[1]),i=e[2];return ww[i](t)}function dd(n){const e=n.match(/^rgb\(\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);if(!e)return null;const t=[an(e[1],255),an(e[2],255),an(e[3],255)];return isNaN(t[0])||isNaN(t[1])||isNaN(t[2])?null:t}function Sw(n){const e=dd(n);return e?new We(e,"rgb"):null}function pd(n){const e=n.match(/^rgba\(\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);if(!e)return null;const t=[an(e[1],255),an(e[2],255),an(e[3],255),an(e[4],1)];return isNaN(t[0])||isNaN(t[1])||isNaN(t[2])||isNaN(t[3])?null:t}function Mw(n){const e=pd(n);return e?new We(e,"rgb"):null}function fd(n){const e=n.match(/^hsl\(\s*([0-9A-Fa-f.]+(?:deg|grad|rad|turn)?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);if(!e)return null;const t=[ud(e[1]),an(e[2],100),an(e[3],100)];return isNaN(t[0])||isNaN(t[1])||isNaN(t[2])?null:t}function Ew(n){const e=fd(n);return e?new We(e,"hsl"):null}function md(n){const e=n.match(/^hsla\(\s*([0-9A-Fa-f.]+(?:deg|grad|rad|turn)?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*,\s*([0-9A-Fa-f.]+%?)\s*\)$/);if(!e)return null;const t=[ud(e[1]),an(e[2],100),an(e[3],100),an(e[4],1)];return isNaN(t[0])||isNaN(t[1])||isNaN(t[2])||isNaN(t[3])?null:t}function Tw(n){const e=md(n);return e?new We(e,"hsl"):null}function vd(n){const e=n.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);if(e)return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16)];const t=n.match(/^(?:#|0x)([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16)]:null}function Cw(n){const e=vd(n);return e?new We(e,"rgb"):null}function gd(n){const e=n.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);if(e)return[parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16),Ye(parseInt(e[4]+e[4],16),0,255,0,1)];const t=n.match(/^(?:#|0x)?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/);return t?[parseInt(t[1],16),parseInt(t[2],16),parseInt(t[3],16),Ye(parseInt(t[4],16),0,255,0,1)]:null}function Aw(n){const e=gd(n);return e?new We(e,"rgb"):null}function _d(n){const e=n.match(/^\{\s*r\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*g\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*b\s*:\s*([0-9A-Fa-f.]+%?)\s*\}$/);if(!e)return null;const t=[parseFloat(e[1]),parseFloat(e[2]),parseFloat(e[3])];return isNaN(t[0])||isNaN(t[1])||isNaN(t[2])?null:t}function Pw(n){return e=>{const t=_d(e);return t?zl(t,"rgb",n):null}}function xd(n){const e=n.match(/^\{\s*r\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*g\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*b\s*:\s*([0-9A-Fa-f.]+%?)\s*,\s*a\s*:\s*([0-9A-Fa-f.]+%?)\s*\}$/);if(!e)return null;const t=[parseFloat(e[1]),parseFloat(e[2]),parseFloat(e[3]),parseFloat(e[4])];return isNaN(t[0])||isNaN(t[1])||isNaN(t[2])||isNaN(t[3])?null:t}function Rw(n){return e=>{const t=xd(e);return t?zl(t,"rgb",n):null}}const Dw=[{parser:vd,result:{alpha:!1,mode:"rgb",notation:"hex"}},{parser:gd,result:{alpha:!0,mode:"rgb",notation:"hex"}},{parser:dd,result:{alpha:!1,mode:"rgb",notation:"func"}},{parser:pd,result:{alpha:!0,mode:"rgb",notation:"func"}},{parser:fd,result:{alpha:!1,mode:"hsl",notation:"func"}},{parser:md,result:{alpha:!0,mode:"hsl",notation:"func"}},{parser:_d,result:{alpha:!1,mode:"rgb",notation:"object"}},{parser:xd,result:{alpha:!0,mode:"rgb",notation:"object"}}];function Lw(n){return Dw.reduce((e,{parser:t,result:i})=>e||(t(n)?i:null),null)}function Iw(n,e="int"){const t=Lw(n);return t?t.notation==="hex"&&e!=="float"?Object.assign(Object.assign({},t),{type:"int"}):t.notation==="func"?Object.assign(Object.assign({},t),{type:e}):null:null}function as(n){const e=[Cw,Aw,Sw,Mw,Ew,Tw];e.push(Pw("int"),Rw("int"));const t=Ky(e);return i=>{const r=t(i);return r?It(r,n):null}}function Uw(n){const e=as("int");if(typeof n!="string")return We.black();const t=e(n);return t??We.black()}function bd(n){const e=xt(Math.floor(n),0,255).toString(16);return e.length===1?`0${e}`:e}function Vl(n,e="#"){const t=wn(n.getComponents("rgb")).map(bd).join("");return`${e}${t}`}function Hl(n,e="#"){const t=n.getComponents("rgb"),i=[t[0],t[1],t[2],t[3]*255].map(bd).join("");return`${e}${i}`}function yd(n){const e=Ht(0),t=It(n,"int");return`rgb(${wn(t.getComponents("rgb")).map(r=>e(r)).join(", ")})`}function Gs(n){const e=Ht(2),t=Ht(0);return`rgba(${It(n,"int").getComponents("rgb").map((s,a)=>(a===3?e:t)(s)).join(", ")})`}function Nw(n){const e=[Ht(0),Qs,Qs],t=It(n,"int");return`hsl(${wn(t.getComponents("hsl")).map((r,s)=>e[s](r)).join(", ")})`}function Fw(n){const e=[Ht(0),Qs,Qs,Ht(2)];return`hsla(${It(n,"int").getComponents("hsl").map((r,s)=>e[s](r)).join(", ")})`}function wd(n,e){const t=Ht(e==="float"?2:0),i=["r","g","b"],r=It(n,e);return`{${wn(r.getComponents("rgb")).map((a,o)=>`${i[o]}: ${t(a)}`).join(", ")}}`}function Ow(n){return e=>wd(e,n)}function Sd(n,e){const t=Ht(2),i=Ht(e==="float"?2:0),r=["r","g","b","a"];return`{${It(n,e).getComponents("rgb").map((o,l)=>{const c=l===3?t:i;return`${r[l]}: ${c(o)}`}).join(", ")}}`}function kw(n){return e=>Sd(e,n)}const Bw=[{format:{alpha:!1,mode:"rgb",notation:"hex",type:"int"},stringifier:Vl},{format:{alpha:!0,mode:"rgb",notation:"hex",type:"int"},stringifier:Hl},{format:{alpha:!1,mode:"rgb",notation:"func",type:"int"},stringifier:yd},{format:{alpha:!0,mode:"rgb",notation:"func",type:"int"},stringifier:Gs},{format:{alpha:!1,mode:"hsl",notation:"func",type:"int"},stringifier:Nw},{format:{alpha:!0,mode:"hsl",notation:"func",type:"int"},stringifier:Fw},...["int","float"].reduce((n,e)=>[...n,{format:{alpha:!1,mode:"rgb",notation:"object",type:e},stringifier:Ow(e)},{format:{alpha:!0,mode:"rgb",notation:"object",type:e},stringifier:kw(e)}],[])];function Md(n){return Bw.reduce((e,t)=>e||(yw(t.format,n)?t.stringifier:null),null)}const Or=Ve("apl");class zw{constructor(e,t){this.onValueChange_=this.onValueChange_.bind(this),this.value=t.value,this.value.emitter.on("change",this.onValueChange_),this.element=e.createElement("div"),this.element.classList.add(Or()),t.viewProps.bindClassModifiers(this.element),t.viewProps.bindTabIndex(this.element);const i=e.createElement("div");i.classList.add(Or("b")),this.element.appendChild(i);const r=e.createElement("div");r.classList.add(Or("c")),i.appendChild(r),this.colorElem_=r;const s=e.createElement("div");s.classList.add(Or("m")),this.element.appendChild(s),this.markerElem_=s;const a=e.createElement("div");a.classList.add(Or("p")),this.markerElem_.appendChild(a),this.previewElem_=a,this.update_()}update_(){const e=this.value.rawValue,t=e.getComponents("rgb"),i=new We([t[0],t[1],t[2],0],"rgb"),r=new We([t[0],t[1],t[2],255],"rgb"),s=["to right",Gs(i),Gs(r)];this.colorElem_.style.background=`linear-gradient(${s.join(",")})`,this.previewElem_.style.backgroundColor=Gs(e);const a=Ye(t[3],0,1,0,100);this.markerElem_.style.left=`${a}%`}onValueChange_(){this.update_()}}class Vw{constructor(e,t){this.onKeyDown_=this.onKeyDown_.bind(this),this.onKeyUp_=this.onKeyUp_.bind(this),this.onPointerDown_=this.onPointerDown_.bind(this),this.onPointerMove_=this.onPointerMove_.bind(this),this.onPointerUp_=this.onPointerUp_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.view=new zw(e,{value:this.value,viewProps:this.viewProps}),this.ptHandler_=new Li(this.view.element),this.ptHandler_.emitter.on("down",this.onPointerDown_),this.ptHandler_.emitter.on("move",this.onPointerMove_),this.ptHandler_.emitter.on("up",this.onPointerUp_),this.view.element.addEventListener("keydown",this.onKeyDown_),this.view.element.addEventListener("keyup",this.onKeyUp_)}handlePointerEvent_(e,t){if(!e.point)return;const i=e.point.x/e.bounds.width,r=this.value.rawValue,[s,a,o]=r.getComponents("hsv");this.value.setRawValue(new We([s,a,o,i],"hsv"),t)}onPointerDown_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerMove_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerUp_(e){this.handlePointerEvent_(e.data,{forceEmit:!0,last:!0})}onKeyDown_(e){const t=Bt(Ci(!0),zn(e));if(t===0)return;const i=this.value.rawValue,[r,s,a,o]=i.getComponents("hsv");this.value.setRawValue(new We([r,s,a,o+t],"hsv"),{forceEmit:!1,last:!1})}onKeyUp_(e){Bt(Ci(!0),zn(e))!==0&&this.value.setRawValue(this.value.rawValue,{forceEmit:!0,last:!0})}}const Zi=Ve("coltxt");function Hw(n){const e=n.createElement("select"),t=[{text:"RGB",value:"rgb"},{text:"HSL",value:"hsl"},{text:"HSV",value:"hsv"},{text:"HEX",value:"hex"}];return e.appendChild(t.reduce((i,r)=>{const s=n.createElement("option");return s.textContent=r.text,s.value=r.value,i.appendChild(s),i},n.createDocumentFragment())),e}class Gw{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Zi()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add(Zi("m")),this.modeElem_=Hw(e),this.modeElem_.classList.add(Zi("ms")),i.appendChild(this.modeSelectElement),t.viewProps.bindDisabled(this.modeElem_);const r=e.createElement("div");r.classList.add(Zi("mm")),r.appendChild(pa(e,"dropdown")),i.appendChild(r),this.element.appendChild(i);const s=e.createElement("div");s.classList.add(Zi("w")),this.element.appendChild(s),this.inputsElem_=s,this.inputViews_=t.inputViews,this.applyInputViews_(),On(t.mode,a=>{this.modeElem_.value=a})}get modeSelectElement(){return this.modeElem_}get inputViews(){return this.inputViews_}set inputViews(e){this.inputViews_=e,this.applyInputViews_()}applyInputViews_(){Wu(this.inputsElem_);const e=this.element.ownerDocument;this.inputViews_.forEach(t=>{const i=e.createElement("div");i.classList.add(Zi("c")),i.appendChild(t.element),this.inputsElem_.appendChild(i)})}}function Ww(n){return Ht(n==="float"?2:0)}function Xw(n,e,t){const i=vr(n,e)[t];return new Jr({min:0,max:i})}function jw(n,e,t){return new rs(n,{arrayPosition:t===0?"fst":t===2?"lst":"mid",parser:e.parser,props:Ne.fromObject({formatter:Ww(e.colorType),keyScale:Ci(!1),pointerScale:e.colorType==="float"?.01:1}),value:st(0,{constraint:Xw(e.colorMode,e.colorType,t)}),viewProps:e.viewProps})}function Kw(n,e){const t={colorMode:e.colorMode,colorType:e.colorType,parser:Bn,viewProps:e.viewProps};return[0,1,2].map(i=>{const r=jw(n,t,i);return wr({primary:e.value,secondary:r.value,forward(s){return It(s,e.colorType).getComponents(e.colorMode)[i]},backward(s,a){const o=e.colorMode,c=It(s,e.colorType).getComponents(o);c[i]=a;const h=zl(ma(wn(c),c[3]),o,e.colorType);return It(h,"int")}}),r})}function qw(n,e){const t=new Xr(n,{parser:as("int"),props:Ne.fromObject({formatter:Vl}),value:st(We.black()),viewProps:e.viewProps});return wr({primary:e.value,secondary:t.value,forward:i=>new We(wn(i.getComponents()),i.mode),backward:(i,r)=>new We(ma(wn(r.getComponents(i.mode)),i.getComponents()[3]),i.mode)}),[t]}function Yw(n){return n!=="hex"}class $w{constructor(e,t){this.onModeSelectChange_=this.onModeSelectChange_.bind(this),this.colorType_=t.colorType,this.value=t.value,this.viewProps=t.viewProps,this.colorMode=st(this.value.rawValue.mode),this.ccs_=this.createComponentControllers_(e),this.view=new Gw(e,{mode:this.colorMode,inputViews:[this.ccs_[0].view,this.ccs_[1].view,this.ccs_[2].view],viewProps:this.viewProps}),this.view.modeSelectElement.addEventListener("change",this.onModeSelectChange_)}createComponentControllers_(e){const t=this.colorMode.rawValue;return Yw(t)?Kw(e,{colorMode:t,colorType:this.colorType_,value:this.value,viewProps:this.viewProps}):qw(e,{value:this.value,viewProps:this.viewProps})}onModeSelectChange_(e){const t=e.currentTarget;this.colorMode.rawValue=t.value,this.ccs_=this.createComponentControllers_(this.view.element.ownerDocument),this.view.inputViews=this.ccs_.map(i=>i.view)}}const oo=Ve("hpl");class Zw{constructor(e,t){this.onValueChange_=this.onValueChange_.bind(this),this.value=t.value,this.value.emitter.on("change",this.onValueChange_),this.element=e.createElement("div"),this.element.classList.add(oo()),t.viewProps.bindClassModifiers(this.element),t.viewProps.bindTabIndex(this.element);const i=e.createElement("div");i.classList.add(oo("c")),this.element.appendChild(i);const r=e.createElement("div");r.classList.add(oo("m")),this.element.appendChild(r),this.markerElem_=r,this.update_()}update_(){const e=this.value.rawValue,[t]=e.getComponents("hsv");this.markerElem_.style.backgroundColor=yd(new We([t,100,100],"hsv"));const i=Ye(t,0,360,0,100);this.markerElem_.style.left=`${i}%`}onValueChange_(){this.update_()}}class Jw{constructor(e,t){this.onKeyDown_=this.onKeyDown_.bind(this),this.onKeyUp_=this.onKeyUp_.bind(this),this.onPointerDown_=this.onPointerDown_.bind(this),this.onPointerMove_=this.onPointerMove_.bind(this),this.onPointerUp_=this.onPointerUp_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.view=new Zw(e,{value:this.value,viewProps:this.viewProps}),this.ptHandler_=new Li(this.view.element),this.ptHandler_.emitter.on("down",this.onPointerDown_),this.ptHandler_.emitter.on("move",this.onPointerMove_),this.ptHandler_.emitter.on("up",this.onPointerUp_),this.view.element.addEventListener("keydown",this.onKeyDown_),this.view.element.addEventListener("keyup",this.onKeyUp_)}handlePointerEvent_(e,t){if(!e.point)return;const i=Ye(xt(e.point.x,0,e.bounds.width),0,e.bounds.width,0,360),r=this.value.rawValue,[,s,a,o]=r.getComponents("hsv");this.value.setRawValue(new We([i,s,a,o],"hsv"),t)}onPointerDown_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerMove_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerUp_(e){this.handlePointerEvent_(e.data,{forceEmit:!0,last:!0})}onKeyDown_(e){const t=Bt(Ci(!1),zn(e));if(t===0)return;const i=this.value.rawValue,[r,s,a,o]=i.getComponents("hsv");this.value.setRawValue(new We([r+t,s,a,o],"hsv"),{forceEmit:!1,last:!1})}onKeyUp_(e){Bt(Ci(!1),zn(e))!==0&&this.value.setRawValue(this.value.rawValue,{forceEmit:!0,last:!0})}}const lo=Ve("svp"),Dh=64;class Qw{constructor(e,t){this.onValueChange_=this.onValueChange_.bind(this),this.value=t.value,this.value.emitter.on("change",this.onValueChange_),this.element=e.createElement("div"),this.element.classList.add(lo()),t.viewProps.bindClassModifiers(this.element),t.viewProps.bindTabIndex(this.element);const i=e.createElement("canvas");i.height=Dh,i.width=Dh,i.classList.add(lo("c")),this.element.appendChild(i),this.canvasElement=i;const r=e.createElement("div");r.classList.add(lo("m")),this.element.appendChild(r),this.markerElem_=r,this.update_()}update_(){const e=Jb(this.canvasElement);if(!e)return;const i=this.value.rawValue.getComponents("hsv"),r=this.canvasElement.width,s=this.canvasElement.height,a=e.getImageData(0,0,r,s),o=a.data;for(let h=0;h<s;h++)for(let u=0;u<r;u++){const d=Ye(u,0,r,0,100),m=Ye(h,0,s,100,0),g=od(i[0],d,m),x=(h*r+u)*4;o[x]=g[0],o[x+1]=g[1],o[x+2]=g[2],o[x+3]=255}e.putImageData(a,0,0);const l=Ye(i[1],0,100,0,100);this.markerElem_.style.left=`${l}%`;const c=Ye(i[2],0,100,100,0);this.markerElem_.style.top=`${c}%`}onValueChange_(){this.update_()}}class eS{constructor(e,t){this.onKeyDown_=this.onKeyDown_.bind(this),this.onKeyUp_=this.onKeyUp_.bind(this),this.onPointerDown_=this.onPointerDown_.bind(this),this.onPointerMove_=this.onPointerMove_.bind(this),this.onPointerUp_=this.onPointerUp_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.view=new Qw(e,{value:this.value,viewProps:this.viewProps}),this.ptHandler_=new Li(this.view.element),this.ptHandler_.emitter.on("down",this.onPointerDown_),this.ptHandler_.emitter.on("move",this.onPointerMove_),this.ptHandler_.emitter.on("up",this.onPointerUp_),this.view.element.addEventListener("keydown",this.onKeyDown_),this.view.element.addEventListener("keyup",this.onKeyUp_)}handlePointerEvent_(e,t){if(!e.point)return;const i=Ye(e.point.x,0,e.bounds.width,0,100),r=Ye(e.point.y,0,e.bounds.height,100,0),[s,,,a]=this.value.rawValue.getComponents("hsv");this.value.setRawValue(new We([s,i,r,a],"hsv"),t)}onPointerDown_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerMove_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerUp_(e){this.handlePointerEvent_(e.data,{forceEmit:!0,last:!0})}onKeyDown_(e){id(e.key)&&e.preventDefault();const[t,i,r,s]=this.value.rawValue.getComponents("hsv"),a=Ci(!1),o=Bt(a,zn(e)),l=Bt(a,jr(e));o===0&&l===0||this.value.setRawValue(new We([t,i+o,r+l,s],"hsv"),{forceEmit:!1,last:!1})}onKeyUp_(e){const t=Ci(!1),i=Bt(t,zn(e)),r=Bt(t,jr(e));i===0&&r===0||this.value.setRawValue(this.value.rawValue,{forceEmit:!0,last:!0})}}class tS{constructor(e,t){this.value=t.value,this.viewProps=t.viewProps,this.hPaletteC_=new Jw(e,{value:this.value,viewProps:this.viewProps}),this.svPaletteC_=new eS(e,{value:this.value,viewProps:this.viewProps}),this.alphaIcs_=t.supportsAlpha?{palette:new Vw(e,{value:this.value,viewProps:this.viewProps}),text:new rs(e,{parser:Bn,props:Ne.fromObject({pointerScale:.01,keyScale:.1,formatter:Ht(2)}),value:st(0,{constraint:new Jr({min:0,max:1})}),viewProps:this.viewProps})}:null,this.alphaIcs_&&wr({primary:this.value,secondary:this.alphaIcs_.text.value,forward:i=>i.getComponents()[3],backward:(i,r)=>{const s=i.getComponents();return s[3]=r,new We(s,i.mode)}}),this.textsC_=new $w(e,{colorType:t.colorType,value:this.value,viewProps:this.viewProps}),this.view=new fw(e,{alphaViews:this.alphaIcs_?{palette:this.alphaIcs_.palette.view,text:this.alphaIcs_.text.view}:null,hPaletteView:this.hPaletteC_.view,supportsAlpha:t.supportsAlpha,svPaletteView:this.svPaletteC_.view,textsView:this.textsC_.view,viewProps:this.viewProps})}get textsController(){return this.textsC_}}const co=Ve("colsw");class nS{constructor(e,t){this.onValueChange_=this.onValueChange_.bind(this),t.value.emitter.on("change",this.onValueChange_),this.value=t.value,this.element=e.createElement("div"),this.element.classList.add(co()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add(co("sw")),this.element.appendChild(i),this.swatchElem_=i;const r=e.createElement("button");r.classList.add(co("b")),t.viewProps.bindDisabled(r),this.element.appendChild(r),this.buttonElement=r,this.update_()}update_(){const e=this.value.rawValue;this.swatchElem_.style.backgroundColor=Hl(e)}onValueChange_(){this.update_()}}class iS{constructor(e,t){this.value=t.value,this.viewProps=t.viewProps,this.view=new nS(e,{value:this.value,viewProps:this.viewProps})}}class Gl{constructor(e,t){this.onButtonBlur_=this.onButtonBlur_.bind(this),this.onButtonClick_=this.onButtonClick_.bind(this),this.onPopupChildBlur_=this.onPopupChildBlur_.bind(this),this.onPopupChildKeydown_=this.onPopupChildKeydown_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.foldable_=es.create(t.expanded),this.swatchC_=new iS(e,{value:this.value,viewProps:this.viewProps});const i=this.swatchC_.view.buttonElement;i.addEventListener("blur",this.onButtonBlur_),i.addEventListener("click",this.onButtonClick_),this.textC_=new Xr(e,{parser:t.parser,props:Ne.fromObject({formatter:t.formatter}),value:this.value,viewProps:this.viewProps}),this.view=new aw(e,{foldable:this.foldable_,pickerLayout:t.pickerLayout}),this.view.swatchElement.appendChild(this.swatchC_.view.element),this.view.textElement.appendChild(this.textC_.view.element),this.popC_=t.pickerLayout==="popup"?new ed(e,{viewProps:this.viewProps}):null;const r=new tS(e,{colorType:t.colorType,supportsAlpha:t.supportsAlpha,value:this.value,viewProps:this.viewProps});r.view.allFocusableElements.forEach(s=>{s.addEventListener("blur",this.onPopupChildBlur_),s.addEventListener("keydown",this.onPopupChildKeydown_)}),this.pickerC_=r,this.popC_?(this.view.element.appendChild(this.popC_.view.element),this.popC_.view.element.appendChild(r.view.element),wr({primary:this.foldable_.value("expanded"),secondary:this.popC_.shows,forward:s=>s,backward:(s,a)=>a})):this.view.pickerElement&&(this.view.pickerElement.appendChild(this.pickerC_.view.element),Ul(this.foldable_,this.view.pickerElement))}get textController(){return this.textC_}onButtonBlur_(e){if(!this.popC_)return;const t=this.view.element,i=e.relatedTarget;(!i||!t.contains(i))&&(this.popC_.shows.rawValue=!1)}onButtonClick_(){this.foldable_.set("expanded",!this.foldable_.get("expanded")),this.foldable_.get("expanded")&&this.pickerC_.view.allFocusableElements[0].focus()}onPopupChildBlur_(e){if(!this.popC_)return;const t=this.popC_.view.element,i=Xu(e);i&&t.contains(i)||i&&i===this.swatchC_.view.buttonElement&&!Al(t.ownerDocument)||(this.popC_.shows.rawValue=!1)}onPopupChildKeydown_(e){this.popC_?e.key==="Escape"&&(this.popC_.shows.rawValue=!1):this.view.pickerElement&&e.key==="Escape"&&this.swatchC_.view.buttonElement.focus()}}function rS(n){return wn(n.getComponents("rgb")).reduce((e,t)=>e<<8|Math.floor(t)&255,0)}function sS(n){return n.getComponents("rgb").reduce((e,t,i)=>{const r=Math.floor(i===3?t*255:t)&255;return e<<8|r},0)>>>0}function aS(n){return new We([n>>16&255,n>>8&255,n&255],"rgb")}function oS(n){return new We([n>>24&255,n>>16&255,n>>8&255,Ye(n&255,0,255,0,1)],"rgb")}function lS(n){return typeof n!="number"?We.black():aS(n)}function cS(n){return typeof n!="number"?We.black():oS(n)}function Ws(n,e){return typeof n!="object"||tt(n)?!1:e in n&&typeof n[e]=="number"}function Ed(n){return Ws(n,"r")&&Ws(n,"g")&&Ws(n,"b")}function Td(n){return Ed(n)&&Ws(n,"a")}function Cd(n){return Ed(n)}function Wl(n,e){if(n.mode!==e.mode||n.type!==e.type)return!1;const t=n.getComponents(),i=e.getComponents();for(let r=0;r<t.length;r++)if(t[r]!==i[r])return!1;return!0}function Lh(n){return"a"in n?[n.r,n.g,n.b,n.a]:[n.r,n.g,n.b]}function hS(n){const e=Md(n);return e?(t,i)=>{ss(t,e(i))}:null}function uS(n){const e=n?sS:rS;return(t,i)=>{ss(t,e(i))}}function dS(n,e,t){const r=It(e,t).toRgbaObject();n.writeProperty("r",r.r),n.writeProperty("g",r.g),n.writeProperty("b",r.b),n.writeProperty("a",r.a)}function pS(n,e,t){const r=It(e,t).toRgbaObject();n.writeProperty("r",r.r),n.writeProperty("g",r.g),n.writeProperty("b",r.b)}function fS(n,e){return(t,i)=>{n?dS(t,i,e):pS(t,i,e)}}function mS(n){var e;return!!(!((e=n?.color)===null||e===void 0)&&e.alpha)}function vS(n){return n?e=>Hl(e,"0x"):e=>Vl(e,"0x")}function gS(n){return"color"in n||n.view==="color"}const _S=Ut({id:"input-color-number",type:"input",accept:(n,e)=>{if(typeof n!="number"||!gS(e))return null;const t=kl(e);return t?{initialValue:n,params:Object.assign(Object.assign({},t),{supportsAlpha:mS(e)})}:null},binding:{reader:n=>n.params.supportsAlpha?cS:lS,equals:Wl,writer:n=>uS(n.params.supportsAlpha)},controller:n=>{var e,t;return new Gl(n.document,{colorType:"int",expanded:(e=n.params.expanded)!==null&&e!==void 0?e:!1,formatter:vS(n.params.supportsAlpha),parser:as("int"),pickerLayout:(t=n.params.picker)!==null&&t!==void 0?t:"popup",supportsAlpha:n.params.supportsAlpha,value:n.value,viewProps:n.viewProps})}});function xS(n,e){if(!Cd(n))return It(We.black(),e);if(e==="int"){const t=Lh(n);return new We(t,"rgb")}if(e==="float"){const t=Lh(n);return new Bl(t,"rgb")}return It(We.black(),"int")}function bS(n){return Td(n)}function yS(n){return e=>{const t=xS(e,n);return It(t,"int")}}function wS(n,e){return t=>n?Sd(t,e):wd(t,e)}const SS=Ut({id:"input-color-object",type:"input",accept:(n,e)=>{var t;if(!Cd(n))return null;const i=kl(e);return i?{initialValue:n,params:Object.assign(Object.assign({},i),{colorType:(t=hd(e))!==null&&t!==void 0?t:"int"})}:null},binding:{reader:n=>yS(n.params.colorType),equals:Wl,writer:n=>fS(bS(n.initialValue),n.params.colorType)},controller:n=>{var e,t;const i=Td(n.initialValue);return new Gl(n.document,{colorType:n.params.colorType,expanded:(e=n.params.expanded)!==null&&e!==void 0?e:!1,formatter:wS(i,n.params.colorType),parser:as("int"),pickerLayout:(t=n.params.picker)!==null&&t!==void 0?t:"popup",supportsAlpha:i,value:n.value,viewProps:n.viewProps})}}),MS=Ut({id:"input-color-string",type:"input",accept:(n,e)=>{if(typeof n!="string"||e.view==="text")return null;const t=Iw(n,hd(e));if(!t)return null;const i=Md(t);if(!i)return null;const r=kl(e);return r?{initialValue:n,params:Object.assign(Object.assign({},r),{format:t,stringifier:i})}:null},binding:{reader:()=>Uw,equals:Wl,writer:n=>{const e=hS(n.params.format);if(!e)throw ht.notBindable();return e}},controller:n=>{var e,t;return new Gl(n.document,{colorType:n.params.format.type,expanded:(e=n.params.expanded)!==null&&e!==void 0?e:!1,formatter:n.params.stringifier,parser:as("int"),pickerLayout:(t=n.params.picker)!==null&&t!==void 0?t:"popup",supportsAlpha:n.params.format.alpha,value:n.value,viewProps:n.viewProps})}});class Xl{constructor(e){this.components=e.components,this.asm_=e.assembly}constrain(e){const t=this.asm_.toComponents(e).map((i,r)=>{var s,a;return(a=(s=this.components[r])===null||s===void 0?void 0:s.constrain(i))!==null&&a!==void 0?a:i});return this.asm_.fromComponents(t)}}const Ih=Ve("pndtxt");class ES{constructor(e,t){this.textViews=t.textViews,this.element=e.createElement("div"),this.element.classList.add(Ih()),this.textViews.forEach(i=>{const r=e.createElement("div");r.classList.add(Ih("a")),r.appendChild(i.element),this.element.appendChild(r)})}}function TS(n,e,t){return new rs(n,{arrayPosition:t===0?"fst":t===e.axes.length-1?"lst":"mid",parser:e.parser,props:e.axes[t].textProps,value:st(0,{constraint:e.axes[t].constraint}),viewProps:e.viewProps})}class jl{constructor(e,t){this.value=t.value,this.viewProps=t.viewProps,this.acs_=t.axes.map((i,r)=>TS(e,t,r)),this.acs_.forEach((i,r)=>{wr({primary:this.value,secondary:i.value,forward:s=>t.assembly.toComponents(s)[r],backward:(s,a)=>{const o=t.assembly.toComponents(s);return o[r]=a,t.assembly.fromComponents(o)}})}),this.view=new ES(e,{textViews:this.acs_.map(i=>i.view)})}get textControllers(){return this.acs_}}class CS extends Wr{get max(){return this.controller.valueController.sliderController.props.get("max")}set max(e){this.controller.valueController.sliderController.props.set("max",e)}get min(){return this.controller.valueController.sliderController.props.get("min")}set min(e){this.controller.valueController.sliderController.props.set("min",e)}}function AS(n,e){const t=[],i=ku(n,e);i&&t.push(i);const r=Bu(n);r&&t.push(r);const s=Ol(n.options);return s&&t.push(s),new ts(t)}const PS=Ut({id:"input-number",type:"input",accept:(n,e)=>{if(typeof n!="number")return null;const t=ot(e,i=>Object.assign(Object.assign({},Vu(i)),{options:i.optional.custom(is),readonly:i.optional.constant(!1)}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>Uu,constraint:n=>AS(n.params,n.initialValue),writer:n=>ss},controller:n=>{const e=n.value,t=n.constraint,i=t&&Js(t,ns);if(i)return new ri(n.document,{props:new Ne({options:i.values.value("options")}),value:e,viewProps:n.viewProps});const r=zu(n.params,e.rawValue),s=t&&Js(t,Jr);return s?new ea(n.document,Object.assign(Object.assign({},rd(Object.assign(Object.assign({},r),{keyScale:st(r.keyScale),max:s.values.value("max"),min:s.values.value("min")}))),{parser:Bn,value:e,viewProps:n.viewProps})):new rs(n.document,{parser:Bn,props:Ne.fromObject(r),value:e,viewProps:n.viewProps})},api(n){return typeof n.controller.value.rawValue!="number"?null:n.controller.valueController instanceof ea?new CS(n.controller):n.controller.valueController instanceof ri?new Nl(n.controller):null}});class ti{constructor(e=0,t=0){this.x=e,this.y=t}getComponents(){return[this.x,this.y]}static isObject(e){if(tt(e))return!1;const t=e.x,i=e.y;return!(typeof t!="number"||typeof i!="number")}static equals(e,t){return e.x===t.x&&e.y===t.y}toObject(){return{x:this.x,y:this.y}}}const Ad={toComponents:n=>n.getComponents(),fromComponents:n=>new ti(...n)},Ji=Ve("p2d");class RS{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Ji()),t.viewProps.bindClassModifiers(this.element),On(t.expanded,xr(this.element,Ji(void 0,"expanded")));const i=e.createElement("div");i.classList.add(Ji("h")),this.element.appendChild(i);const r=e.createElement("button");r.classList.add(Ji("b")),r.appendChild(pa(e,"p2dpad")),t.viewProps.bindDisabled(r),i.appendChild(r),this.buttonElement=r;const s=e.createElement("div");if(s.classList.add(Ji("t")),i.appendChild(s),this.textElement=s,t.pickerLayout==="inline"){const a=e.createElement("div");a.classList.add(Ji("p")),this.element.appendChild(a),this.pickerElement=a}else this.pickerElement=null}}const $n=Ve("p2dp");class DS{constructor(e,t){this.onFoldableChange_=this.onFoldableChange_.bind(this),this.onPropsChange_=this.onPropsChange_.bind(this),this.onValueChange_=this.onValueChange_.bind(this),this.props_=t.props,this.props_.emitter.on("change",this.onPropsChange_),this.element=e.createElement("div"),this.element.classList.add($n()),t.layout==="popup"&&this.element.classList.add($n(void 0,"p")),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("div");i.classList.add($n("p")),t.viewProps.bindTabIndex(i),this.element.appendChild(i),this.padElement=i;const r=e.createElementNS(gn,"svg");r.classList.add($n("g")),this.padElement.appendChild(r),this.svgElem_=r;const s=e.createElementNS(gn,"line");s.classList.add($n("ax")),s.setAttributeNS(null,"x1","0"),s.setAttributeNS(null,"y1","50%"),s.setAttributeNS(null,"x2","100%"),s.setAttributeNS(null,"y2","50%"),this.svgElem_.appendChild(s);const a=e.createElementNS(gn,"line");a.classList.add($n("ax")),a.setAttributeNS(null,"x1","50%"),a.setAttributeNS(null,"y1","0"),a.setAttributeNS(null,"x2","50%"),a.setAttributeNS(null,"y2","100%"),this.svgElem_.appendChild(a);const o=e.createElementNS(gn,"line");o.classList.add($n("l")),o.setAttributeNS(null,"x1","50%"),o.setAttributeNS(null,"y1","50%"),this.svgElem_.appendChild(o),this.lineElem_=o;const l=e.createElement("div");l.classList.add($n("m")),this.padElement.appendChild(l),this.markerElem_=l,t.value.emitter.on("change",this.onValueChange_),this.value=t.value,this.update_()}get allFocusableElements(){return[this.padElement]}update_(){const[e,t]=this.value.rawValue.getComponents(),i=this.props_.get("max"),r=Ye(e,-i,+i,0,100),s=Ye(t,-i,+i,0,100),a=this.props_.get("invertsY")?100-s:s;this.lineElem_.setAttributeNS(null,"x2",`${r}%`),this.lineElem_.setAttributeNS(null,"y2",`${a}%`),this.markerElem_.style.left=`${r}%`,this.markerElem_.style.top=`${a}%`}onValueChange_(){this.update_()}onPropsChange_(){this.update_()}onFoldableChange_(){this.update_()}}function Uh(n,e,t){return[Bt(e[0],zn(n)),Bt(e[1],jr(n))*(t?1:-1)]}class LS{constructor(e,t){this.onPadKeyDown_=this.onPadKeyDown_.bind(this),this.onPadKeyUp_=this.onPadKeyUp_.bind(this),this.onPointerDown_=this.onPointerDown_.bind(this),this.onPointerMove_=this.onPointerMove_.bind(this),this.onPointerUp_=this.onPointerUp_.bind(this),this.props=t.props,this.value=t.value,this.viewProps=t.viewProps,this.view=new DS(e,{layout:t.layout,props:this.props,value:this.value,viewProps:this.viewProps}),this.ptHandler_=new Li(this.view.padElement),this.ptHandler_.emitter.on("down",this.onPointerDown_),this.ptHandler_.emitter.on("move",this.onPointerMove_),this.ptHandler_.emitter.on("up",this.onPointerUp_),this.view.padElement.addEventListener("keydown",this.onPadKeyDown_),this.view.padElement.addEventListener("keyup",this.onPadKeyUp_)}handlePointerEvent_(e,t){if(!e.point)return;const i=this.props.get("max"),r=Ye(e.point.x,0,e.bounds.width,-i,+i),s=Ye(this.props.get("invertsY")?e.bounds.height-e.point.y:e.point.y,0,e.bounds.height,-i,+i);this.value.setRawValue(new ti(r,s),t)}onPointerDown_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerMove_(e){this.handlePointerEvent_(e.data,{forceEmit:!1,last:!1})}onPointerUp_(e){this.handlePointerEvent_(e.data,{forceEmit:!0,last:!0})}onPadKeyDown_(e){id(e.key)&&e.preventDefault();const[t,i]=Uh(e,[this.props.get("xKeyScale"),this.props.get("yKeyScale")],this.props.get("invertsY"));t===0&&i===0||this.value.setRawValue(new ti(this.value.rawValue.x+t,this.value.rawValue.y+i),{forceEmit:!1,last:!1})}onPadKeyUp_(e){const[t,i]=Uh(e,[this.props.get("xKeyScale"),this.props.get("yKeyScale")],this.props.get("invertsY"));t===0&&i===0||this.value.setRawValue(this.value.rawValue,{forceEmit:!0,last:!0})}}class IS{constructor(e,t){var i,r;this.onPopupChildBlur_=this.onPopupChildBlur_.bind(this),this.onPopupChildKeydown_=this.onPopupChildKeydown_.bind(this),this.onPadButtonBlur_=this.onPadButtonBlur_.bind(this),this.onPadButtonClick_=this.onPadButtonClick_.bind(this),this.value=t.value,this.viewProps=t.viewProps,this.foldable_=es.create(t.expanded),this.popC_=t.pickerLayout==="popup"?new ed(e,{viewProps:this.viewProps}):null;const s=new LS(e,{layout:t.pickerLayout,props:new Ne({invertsY:st(t.invertsY),max:st(t.max),xKeyScale:t.axes[0].textProps.value("keyScale"),yKeyScale:t.axes[1].textProps.value("keyScale")}),value:this.value,viewProps:this.viewProps});s.view.allFocusableElements.forEach(a=>{a.addEventListener("blur",this.onPopupChildBlur_),a.addEventListener("keydown",this.onPopupChildKeydown_)}),this.pickerC_=s,this.textC_=new jl(e,{assembly:Ad,axes:t.axes,parser:t.parser,value:this.value,viewProps:this.viewProps}),this.view=new RS(e,{expanded:this.foldable_.value("expanded"),pickerLayout:t.pickerLayout,viewProps:this.viewProps}),this.view.textElement.appendChild(this.textC_.view.element),(i=this.view.buttonElement)===null||i===void 0||i.addEventListener("blur",this.onPadButtonBlur_),(r=this.view.buttonElement)===null||r===void 0||r.addEventListener("click",this.onPadButtonClick_),this.popC_?(this.view.element.appendChild(this.popC_.view.element),this.popC_.view.element.appendChild(this.pickerC_.view.element),wr({primary:this.foldable_.value("expanded"),secondary:this.popC_.shows,forward:a=>a,backward:(a,o)=>o})):this.view.pickerElement&&(this.view.pickerElement.appendChild(this.pickerC_.view.element),Ul(this.foldable_,this.view.pickerElement))}get textController(){return this.textC_}onPadButtonBlur_(e){if(!this.popC_)return;const t=this.view.element,i=e.relatedTarget;(!i||!t.contains(i))&&(this.popC_.shows.rawValue=!1)}onPadButtonClick_(){this.foldable_.set("expanded",!this.foldable_.get("expanded")),this.foldable_.get("expanded")&&this.pickerC_.view.allFocusableElements[0].focus()}onPopupChildBlur_(e){if(!this.popC_)return;const t=this.popC_.view.element,i=Xu(e);i&&t.contains(i)||i&&i===this.view.buttonElement&&!Al(t.ownerDocument)||(this.popC_.shows.rawValue=!1)}onPopupChildKeydown_(e){this.popC_?e.key==="Escape"&&(this.popC_.shows.rawValue=!1):this.view.pickerElement&&e.key==="Escape"&&this.view.buttonElement.focus()}}function US(n){return ti.isObject(n)?new ti(n.x,n.y):new ti}function NS(n,e){n.writeProperty("x",e.x),n.writeProperty("y",e.y)}function FS(n,e){return new Xl({assembly:Ad,components:[Nn(Object.assign(Object.assign({},n),n.x),e.x),Nn(Object.assign(Object.assign({},n),n.y),e.y)]})}function Nh(n,e){var t,i;if(!tt(n.min)||!tt(n.max))return Math.max(Math.abs((t=n.min)!==null&&t!==void 0?t:0),Math.abs((i=n.max)!==null&&i!==void 0?i:0));const r=Fu(n);return Math.max(Math.abs(r)*10,Math.abs(e)*10)}function OS(n,e){var t,i;const r=Nh(Ei(n,(t=n.x)!==null&&t!==void 0?t:{}),e.x),s=Nh(Ei(n,(i=n.y)!==null&&i!==void 0?i:{}),e.y);return Math.max(r,s)}function kS(n){if(!("y"in n))return!1;const e=n.y;return e&&"inverted"in e?!!e.inverted:!1}const BS=Ut({id:"input-point2d",type:"input",accept:(n,e)=>{if(!ti.isObject(n))return null;const t=ot(e,i=>Object.assign(Object.assign({},Kr(i)),{expanded:i.optional.boolean,picker:i.optional.custom(ad),readonly:i.optional.constant(!1),x:i.optional.custom(Qn),y:i.optional.object(Object.assign(Object.assign({},Kr(i)),{inverted:i.optional.boolean}))}));return t?{initialValue:n,params:t}:null},binding:{reader:()=>US,constraint:n=>FS(n.params,n.initialValue),equals:ti.equals,writer:()=>NS},controller:n=>{var e,t;const i=n.document,r=n.value,s=n.constraint,a=[n.params.x,n.params.y];return new IS(i,{axes:r.rawValue.getComponents().map((o,l)=>{var c;return Cl({constraint:s.components[l],initialValue:o,params:Ei(n.params,(c=a[l])!==null&&c!==void 0?c:{})})}),expanded:(e=n.params.expanded)!==null&&e!==void 0?e:!1,invertsY:kS(n.params),max:OS(n.params,r.rawValue),parser:Bn,pickerLayout:(t=n.params.picker)!==null&&t!==void 0?t:"popup",value:r,viewProps:n.viewProps})}});class ar{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}getComponents(){return[this.x,this.y,this.z]}static isObject(e){if(tt(e))return!1;const t=e.x,i=e.y,r=e.z;return!(typeof t!="number"||typeof i!="number"||typeof r!="number")}static equals(e,t){return e.x===t.x&&e.y===t.y&&e.z===t.z}toObject(){return{x:this.x,y:this.y,z:this.z}}}const Pd={toComponents:n=>n.getComponents(),fromComponents:n=>new ar(...n)};function zS(n){return ar.isObject(n)?new ar(n.x,n.y,n.z):new ar}function VS(n,e){n.writeProperty("x",e.x),n.writeProperty("y",e.y),n.writeProperty("z",e.z)}function HS(n,e){return new Xl({assembly:Pd,components:[Nn(Object.assign(Object.assign({},n),n.x),e.x),Nn(Object.assign(Object.assign({},n),n.y),e.y),Nn(Object.assign(Object.assign({},n),n.z),e.z)]})}const GS=Ut({id:"input-point3d",type:"input",accept:(n,e)=>{if(!ar.isObject(n))return null;const t=ot(e,i=>Object.assign(Object.assign({},Kr(i)),{readonly:i.optional.constant(!1),x:i.optional.custom(Qn),y:i.optional.custom(Qn),z:i.optional.custom(Qn)}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>zS,constraint:n=>HS(n.params,n.initialValue),equals:ar.equals,writer:n=>VS},controller:n=>{const e=n.value,t=n.constraint,i=[n.params.x,n.params.y,n.params.z];return new jl(n.document,{assembly:Pd,axes:e.rawValue.getComponents().map((r,s)=>{var a;return Cl({constraint:t.components[s],initialValue:r,params:Ei(n.params,(a=i[s])!==null&&a!==void 0?a:{})})}),parser:Bn,value:e,viewProps:n.viewProps})}});class or{constructor(e=0,t=0,i=0,r=0){this.x=e,this.y=t,this.z=i,this.w=r}getComponents(){return[this.x,this.y,this.z,this.w]}static isObject(e){if(tt(e))return!1;const t=e.x,i=e.y,r=e.z,s=e.w;return!(typeof t!="number"||typeof i!="number"||typeof r!="number"||typeof s!="number")}static equals(e,t){return e.x===t.x&&e.y===t.y&&e.z===t.z&&e.w===t.w}toObject(){return{x:this.x,y:this.y,z:this.z,w:this.w}}}const Rd={toComponents:n=>n.getComponents(),fromComponents:n=>new or(...n)};function WS(n){return or.isObject(n)?new or(n.x,n.y,n.z,n.w):new or}function XS(n,e){n.writeProperty("x",e.x),n.writeProperty("y",e.y),n.writeProperty("z",e.z),n.writeProperty("w",e.w)}function jS(n,e){return new Xl({assembly:Rd,components:[Nn(Object.assign(Object.assign({},n),n.x),e.x),Nn(Object.assign(Object.assign({},n),n.y),e.y),Nn(Object.assign(Object.assign({},n),n.z),e.z),Nn(Object.assign(Object.assign({},n),n.w),e.w)]})}const KS=Ut({id:"input-point4d",type:"input",accept:(n,e)=>{if(!or.isObject(n))return null;const t=ot(e,i=>Object.assign(Object.assign({},Kr(i)),{readonly:i.optional.constant(!1),w:i.optional.custom(Qn),x:i.optional.custom(Qn),y:i.optional.custom(Qn),z:i.optional.custom(Qn)}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>WS,constraint:n=>jS(n.params,n.initialValue),equals:or.equals,writer:n=>XS},controller:n=>{const e=n.value,t=n.constraint,i=[n.params.x,n.params.y,n.params.z,n.params.w];return new jl(n.document,{assembly:Rd,axes:e.rawValue.getComponents().map((r,s)=>{var a;return Cl({constraint:t.components[s],initialValue:r,params:Ei(n.params,(a=i[s])!==null&&a!==void 0?a:{})})}),parser:Bn,value:e,viewProps:n.viewProps})}});function qS(n){const e=[],t=Ol(n.options);return t&&e.push(t),new ts(e)}const YS=Ut({id:"input-string",type:"input",accept:(n,e)=>{if(typeof n!="string")return null;const t=ot(e,i=>({readonly:i.optional.constant(!1),options:i.optional.custom(is)}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>nd,constraint:n=>qS(n.params),writer:n=>ss},controller:n=>{const e=n.document,t=n.value,i=n.constraint,r=i&&Js(i,ns);return r?new ri(e,{props:new Ne({options:r.values.value("options")}),value:t,viewProps:n.viewProps}):new Xr(e,{parser:s=>s,props:Ne.fromObject({formatter:rl}),value:t,viewProps:n.viewProps})},api(n){return typeof n.controller.value.rawValue!="string"?null:n.controller.valueController instanceof ri?new Nl(n.controller):null}}),os={monitor:{defaultInterval:200,defaultRows:3}},Fh=Ve("mll");class $S{constructor(e,t){this.onValueUpdate_=this.onValueUpdate_.bind(this),this.formatter_=t.formatter,this.element=e.createElement("div"),this.element.classList.add(Fh()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("textarea");i.classList.add(Fh("i")),i.style.height=`calc(var(${sd("containerUnitSize")}) * ${t.rows})`,i.readOnly=!0,t.viewProps.bindDisabled(i),this.element.appendChild(i),this.textareaElem_=i,t.value.emitter.on("change",this.onValueUpdate_),this.value=t.value,this.update_()}update_(){const e=this.textareaElem_,t=e.scrollTop===e.scrollHeight-e.clientHeight,i=[];this.value.rawValue.forEach(r=>{r!==void 0&&i.push(this.formatter_(r))}),e.textContent=i.join(`
`),t&&(e.scrollTop=e.scrollHeight)}onValueUpdate_(){this.update_()}}class Kl{constructor(e,t){this.value=t.value,this.viewProps=t.viewProps,this.view=new $S(e,{formatter:t.formatter,rows:t.rows,value:this.value,viewProps:this.viewProps})}}const Oh=Ve("sgl");class ZS{constructor(e,t){this.onValueUpdate_=this.onValueUpdate_.bind(this),this.formatter_=t.formatter,this.element=e.createElement("div"),this.element.classList.add(Oh()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("input");i.classList.add(Oh("i")),i.readOnly=!0,i.type="text",t.viewProps.bindDisabled(i),this.element.appendChild(i),this.inputElement=i,t.value.emitter.on("change",this.onValueUpdate_),this.value=t.value,this.update_()}update_(){const e=this.value.rawValue,t=e[e.length-1];this.inputElement.value=t!==void 0?this.formatter_(t):""}onValueUpdate_(){this.update_()}}class ql{constructor(e,t){this.value=t.value,this.viewProps=t.viewProps,this.view=new ZS(e,{formatter:t.formatter,value:this.value,viewProps:this.viewProps})}}const JS=Ut({id:"monitor-bool",type:"monitor",accept:(n,e)=>{if(typeof n!="boolean")return null;const t=ot(e,i=>({readonly:i.required.constant(!0),rows:i.optional.number}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>td},controller:n=>{var e;return n.value.rawValue.length===1?new ql(n.document,{formatter:Ph,value:n.value,viewProps:n.viewProps}):new Kl(n.document,{formatter:Ph,rows:(e=n.params.rows)!==null&&e!==void 0?e:os.monitor.defaultRows,value:n.value,viewProps:n.viewProps})}});class QS extends Wr{get max(){return this.controller.valueController.props.get("max")}set max(e){this.controller.valueController.props.set("max",e)}get min(){return this.controller.valueController.props.get("min")}set min(e){this.controller.valueController.props.set("min",e)}}const Zn=Ve("grl");class eM{constructor(e,t){this.onCursorChange_=this.onCursorChange_.bind(this),this.onValueUpdate_=this.onValueUpdate_.bind(this),this.element=e.createElement("div"),this.element.classList.add(Zn()),t.viewProps.bindClassModifiers(this.element),this.formatter_=t.formatter,this.props_=t.props,this.cursor_=t.cursor,this.cursor_.emitter.on("change",this.onCursorChange_);const i=e.createElementNS(gn,"svg");i.classList.add(Zn("g")),i.style.height=`calc(var(${sd("containerUnitSize")}) * ${t.rows})`,this.element.appendChild(i),this.svgElem_=i;const r=e.createElementNS(gn,"polyline");this.svgElem_.appendChild(r),this.lineElem_=r;const s=e.createElement("div");s.classList.add(Zn("t"),Ve("tt")()),this.element.appendChild(s),this.tooltipElem_=s,t.value.emitter.on("change",this.onValueUpdate_),this.value=t.value,this.update_()}get graphElement(){return this.svgElem_}update_(){const{clientWidth:e,clientHeight:t}=this.element,i=this.value.rawValue.length-1,r=this.props_.get("min"),s=this.props_.get("max"),a=[];this.value.rawValue.forEach((u,d)=>{if(u===void 0)return;const m=Ye(d,0,i,0,e),g=Ye(u,r,s,t,0);a.push([m,g].join(","))}),this.lineElem_.setAttributeNS(null,"points",a.join(" "));const o=this.tooltipElem_,l=this.value.rawValue[this.cursor_.rawValue];if(l===void 0){o.classList.remove(Zn("t","a"));return}const c=Ye(this.cursor_.rawValue,0,i,0,e),h=Ye(l,r,s,t,0);o.style.left=`${c}px`,o.style.top=`${h}px`,o.textContent=`${this.formatter_(l)}`,o.classList.contains(Zn("t","a"))||(o.classList.add(Zn("t","a"),Zn("t","in")),Zs(o),o.classList.remove(Zn("t","in")))}onValueUpdate_(){this.update_()}onCursorChange_(){this.update_()}}class Dd{constructor(e,t){if(this.onGraphMouseMove_=this.onGraphMouseMove_.bind(this),this.onGraphMouseLeave_=this.onGraphMouseLeave_.bind(this),this.onGraphPointerDown_=this.onGraphPointerDown_.bind(this),this.onGraphPointerMove_=this.onGraphPointerMove_.bind(this),this.onGraphPointerUp_=this.onGraphPointerUp_.bind(this),this.props=t.props,this.value=t.value,this.viewProps=t.viewProps,this.cursor_=st(-1),this.view=new eM(e,{cursor:this.cursor_,formatter:t.formatter,rows:t.rows,props:this.props,value:this.value,viewProps:this.viewProps}),!Al(e))this.view.element.addEventListener("mousemove",this.onGraphMouseMove_),this.view.element.addEventListener("mouseleave",this.onGraphMouseLeave_);else{const i=new Li(this.view.element);i.emitter.on("down",this.onGraphPointerDown_),i.emitter.on("move",this.onGraphPointerMove_),i.emitter.on("up",this.onGraphPointerUp_)}}importProps(e){return Jt(e,null,t=>({max:t.required.number,min:t.required.number}),t=>(this.props.set("max",t.max),this.props.set("min",t.min),!0))}exportProps(){return Qt(null,{max:this.props.get("max"),min:this.props.get("min")})}onGraphMouseLeave_(){this.cursor_.rawValue=-1}onGraphMouseMove_(e){const{clientWidth:t}=this.view.element;this.cursor_.rawValue=Math.floor(Ye(e.offsetX,0,t,0,this.value.rawValue.length))}onGraphPointerDown_(e){this.onGraphPointerMove_(e)}onGraphPointerMove_(e){if(!e.data.point){this.cursor_.rawValue=-1;return}this.cursor_.rawValue=Math.floor(Ye(e.data.point.x,0,e.data.bounds.width,0,this.value.rawValue.length))}onGraphPointerUp_(){this.cursor_.rawValue=-1}}function sl(n){return tt(n.format)?Ht(2):n.format}function tM(n){var e;return n.value.rawValue.length===1?new ql(n.document,{formatter:sl(n.params),value:n.value,viewProps:n.viewProps}):new Kl(n.document,{formatter:sl(n.params),rows:(e=n.params.rows)!==null&&e!==void 0?e:os.monitor.defaultRows,value:n.value,viewProps:n.viewProps})}function nM(n){var e,t,i;return new Dd(n.document,{formatter:sl(n.params),rows:(e=n.params.rows)!==null&&e!==void 0?e:os.monitor.defaultRows,props:Ne.fromObject({max:(t=n.params.max)!==null&&t!==void 0?t:100,min:(i=n.params.min)!==null&&i!==void 0?i:0}),value:n.value,viewProps:n.viewProps})}function kh(n){return n.view==="graph"}const iM=Ut({id:"monitor-number",type:"monitor",accept:(n,e)=>{if(typeof n!="number")return null;const t=ot(e,i=>({format:i.optional.function,max:i.optional.number,min:i.optional.number,readonly:i.required.constant(!0),rows:i.optional.number,view:i.optional.string}));return t?{initialValue:n,params:t}:null},binding:{defaultBufferSize:n=>kh(n)?64:1,reader:n=>Uu},controller:n=>kh(n.params)?nM(n):tM(n),api:n=>n.controller.valueController instanceof Dd?new QS(n.controller):null}),rM=Ut({id:"monitor-string",type:"monitor",accept:(n,e)=>{if(typeof n!="string")return null;const t=ot(e,i=>({multiline:i.optional.boolean,readonly:i.required.constant(!0),rows:i.optional.number}));return t?{initialValue:n,params:t}:null},binding:{reader:n=>nd},controller:n=>{var e;const t=n.value;return t.rawValue.length>1||n.params.multiline?new Kl(n.document,{formatter:rl,rows:(e=n.params.rows)!==null&&e!==void 0?e:os.monitor.defaultRows,value:t,viewProps:n.viewProps}):new ql(n.document,{formatter:rl,value:t,viewProps:n.viewProps})}});class sM{constructor(){this.map_=new Map}get(e){var t;return(t=this.map_.get(e))!==null&&t!==void 0?t:null}has(e){return this.map_.has(e)}add(e,t){return this.map_.set(e,t),e.viewProps.handleDispose(()=>{this.map_.delete(e)}),t}}class aM{constructor(e){this.target=e.target,this.reader_=e.reader,this.writer_=e.writer}read(){return this.reader_(this.target.read())}write(e){this.writer_(this.target,e)}inject(e){this.write(this.reader_(e))}}function oM(n,e){var t;const i=n.accept(e.target.read(),e.params);if(tt(i))return null;const r={target:e.target,initialValue:i.initialValue,params:i.params},s=ot(e.params,u=>({disabled:u.optional.boolean,hidden:u.optional.boolean,label:u.optional.string,tag:u.optional.string})),a=n.binding.reader(r),o=n.binding.constraint?n.binding.constraint(r):void 0,l=new aM({reader:a,target:e.target,writer:n.binding.writer(r)}),c=new Wb(st(a(i.initialValue),{constraint:o,equals:n.binding.equals}),l),h=n.controller({constraint:o,document:e.document,initialValue:i.initialValue,params:i.params,value:c,viewProps:Vn.create({disabled:s?.disabled,hidden:s?.hidden})});return new sy(e.document,{blade:yr(),props:Ne.fromObject({label:"label"in e.params?(t=s?.label)!==null&&t!==void 0?t:null:e.target.key}),tag:s?.tag,value:c,valueController:h})}class lM{constructor(e){this.target=e.target,this.reader_=e.reader}read(){return this.reader_(this.target.read())}}function cM(n,e){return e===0?new Vy:new Hy(n,e??os.monitor.defaultInterval)}function hM(n,e){var t,i,r;const s=n.accept(e.target.read(),e.params);if(tt(s))return null;const a={target:e.target,initialValue:s.initialValue,params:s.params},o=ot(e.params,d=>({bufferSize:d.optional.number,disabled:d.optional.boolean,hidden:d.optional.boolean,interval:d.optional.number,label:d.optional.string})),l=n.binding.reader(a),c=(i=(t=o?.bufferSize)!==null&&t!==void 0?t:n.binding.defaultBufferSize&&n.binding.defaultBufferSize(s.params))!==null&&i!==void 0?i:1,h=new hy({binding:new lM({reader:l,target:e.target}),bufferSize:c,ticker:cM(e.document,o?.interval)}),u=n.controller({document:e.document,params:s.params,value:h,viewProps:Vn.create({disabled:o?.disabled,hidden:o?.hidden})});return u.viewProps.bindDisabled(h.ticker),u.viewProps.handleDispose(()=>{h.ticker.dispose()}),new dy(e.document,{blade:yr(),props:Ne.fromObject({label:"label"in e.params?(r=o?.label)!==null&&r!==void 0?r:null:e.target.key}),value:h,valueController:u})}class uM{constructor(e){this.pluginsMap_={blades:[],inputs:[],monitors:[]},this.apiCache_=e}getAll(){return[...this.pluginsMap_.blades,...this.pluginsMap_.inputs,...this.pluginsMap_.monitors]}register(e,t){if(!tw(t.core))throw ht.notCompatible(e,t.id);t.type==="blade"?this.pluginsMap_.blades.unshift(t):t.type==="input"?this.pluginsMap_.inputs.unshift(t):t.type==="monitor"&&this.pluginsMap_.monitors.unshift(t)}createInput_(e,t,i){return this.pluginsMap_.inputs.reduce((r,s)=>r??oM(s,{document:e,target:t,params:i}),null)}createMonitor_(e,t,i){return this.pluginsMap_.monitors.reduce((r,s)=>r??hM(s,{document:e,params:i,target:t}),null)}createBinding(e,t,i){const r=t.read();if(tt(r))throw new ht({context:{key:t.key},type:"nomatchingcontroller"});const s=this.createInput_(e,t,i);if(s)return s;const a=this.createMonitor_(e,t,i);if(a)return a;throw new ht({context:{key:t.key},type:"nomatchingcontroller"})}createBlade(e,t){const i=this.pluginsMap_.blades.reduce((r,s)=>r??zy(s,{document:e,params:t}),null);if(!i)throw new ht({type:"nomatchingview",context:{params:t}});return i}createInputBindingApi_(e){const t=this.pluginsMap_.inputs.reduce((i,r)=>{var s,a;return i||((a=(s=r.api)===null||s===void 0?void 0:s.call(r,{controller:e}))!==null&&a!==void 0?a:null)},null);return this.apiCache_.add(e,t??new Wr(e))}createMonitorBindingApi_(e){const t=this.pluginsMap_.monitors.reduce((i,r)=>{var s,a;return i||((a=(s=r.api)===null||s===void 0?void 0:s.call(r,{controller:e}))!==null&&a!==void 0?a:null)},null);return this.apiCache_.add(e,t??new Wr(e))}createBindingApi(e){if(this.apiCache_.has(e))return this.apiCache_.get(e);if(ay(e))return this.createInputBindingApi_(e);if(py(e))return this.createMonitorBindingApi_(e);throw ht.shouldNeverHappen()}createApi(e){if(this.apiCache_.has(e))return this.apiCache_.get(e);if(ry(e))return this.createBindingApi(e);const t=this.pluginsMap_.blades.reduce((i,r)=>i??r.api({controller:e,pool:this}),null);if(!t)throw ht.shouldNeverHappen();return this.apiCache_.add(e,t)}}const dM=new sM;function pM(){const n=new uM(dM);return[BS,GS,KS,YS,PS,MS,SS,_S,sw,JS,rM,iM,_y,Dy,Qu].forEach(e=>{n.register("core",e)}),n}class fM extends Di{constructor(e){super(e),this.emitter_=new vt,this.controller.value.emitter.on("change",t=>{this.emitter_.emit("change",new Qr(this,t.rawValue))})}get label(){return this.controller.labelController.props.get("label")}set label(e){this.controller.labelController.props.set("label",e)}get options(){return this.controller.valueController.props.get("options")}set options(e){this.controller.valueController.props.set("options",e)}get value(){return this.controller.value.rawValue}set value(e){this.controller.value.rawValue=e}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}}class mM extends Di{}class vM extends Di{constructor(e){super(e),this.emitter_=new vt,this.controller.value.emitter.on("change",t=>{this.emitter_.emit("change",new Qr(this,t.rawValue))})}get label(){return this.controller.labelController.props.get("label")}set label(e){this.controller.labelController.props.set("label",e)}get max(){return this.controller.valueController.sliderController.props.get("max")}set max(e){this.controller.valueController.sliderController.props.set("max",e)}get min(){return this.controller.valueController.sliderController.props.get("min")}set min(e){this.controller.valueController.sliderController.props.set("min",e)}get value(){return this.controller.value.rawValue}set value(e){this.controller.value.rawValue=e}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}}class gM extends Di{constructor(e){super(e),this.emitter_=new vt,this.controller.value.emitter.on("change",t=>{this.emitter_.emit("change",new Qr(this,t.rawValue))})}get label(){return this.controller.labelController.props.get("label")}set label(e){this.controller.labelController.props.set("label",e)}get formatter(){return this.controller.valueController.props.get("formatter")}set formatter(e){this.controller.valueController.props.set("formatter",e)}get value(){return this.controller.value.rawValue}set value(e){this.controller.value.rawValue=e}on(e,t){const i=t.bind(this);return this.emitter_.on(e,r=>{i(r)},{key:t}),this}off(e,t){return this.emitter_.off(e,t),this}}const _M=function(){return{id:"list",type:"blade",core:br,accept(n){const e=ot(n,t=>({options:t.required.custom(is),value:t.required.raw,view:t.required.constant("list"),label:t.optional.string}));return e?{params:e}:null},controller(n){const e=new ns(Fl(n.params.options)),t=st(n.params.value,{constraint:e}),i=new ri(n.document,{props:new Ne({options:e.values.value("options")}),value:t,viewProps:n.viewProps});return new Ti(n.document,{blade:n.blade,props:Ne.fromObject({label:n.params.label}),value:t,valueController:i})},api(n){return!(n.controller instanceof Ti)||!(n.controller.valueController instanceof ri)?null:new fM(n.controller)}}}();class xM extends Zu{constructor(e,t){super(e,t)}get element(){return this.controller.view.element}}class bM extends nl{constructor(e,t){super(e,{expanded:t.expanded,blade:t.blade,props:t.props,root:!0,viewProps:t.viewProps})}}const Bh=Ve("spr");class yM{constructor(e,t){this.element=e.createElement("div"),this.element.classList.add(Bh()),t.viewProps.bindClassModifiers(this.element);const i=e.createElement("hr");i.classList.add(Bh("r")),this.element.appendChild(i)}}class zh extends fa{constructor(e,t){super(Object.assign(Object.assign({},t),{view:new yM(e,{viewProps:t.viewProps})}))}}const wM={id:"separator",type:"blade",core:br,accept(n){const e=ot(n,t=>({view:t.required.constant("separator")}));return e?{params:e}:null},controller(n){return new zh(n.document,{blade:n.blade,viewProps:n.viewProps})},api(n){return n.controller instanceof zh?new mM(n.controller):null}},SM={id:"slider",type:"blade",core:br,accept(n){const e=ot(n,t=>({max:t.required.number,min:t.required.number,view:t.required.constant("slider"),format:t.optional.function,label:t.optional.string,value:t.optional.number}));return e?{params:e}:null},controller(n){var e,t;const i=(e=n.params.value)!==null&&e!==void 0?e:0,r=new Jr({max:n.params.max,min:n.params.min}),s=st(i,{constraint:r}),a=new ea(n.document,Object.assign(Object.assign({},rd({formatter:(t=n.params.format)!==null&&t!==void 0?t:Bb,keyScale:st(1),max:r.values.value("max"),min:r.values.value("min"),pointerScale:Ou(n.params,i)})),{parser:Bn,value:s,viewProps:n.viewProps}));return new Ti(n.document,{blade:n.blade,props:Ne.fromObject({label:n.params.label}),value:s,valueController:a})},api(n){return!(n.controller instanceof Ti)||!(n.controller.valueController instanceof ea)?null:new vM(n.controller)}},MM=function(){return{id:"text",type:"blade",core:br,accept(n){const e=ot(n,t=>({parse:t.required.function,value:t.required.raw,view:t.required.constant("text"),format:t.optional.function,label:t.optional.string}));return e?{params:e}:null},controller(n){var e;const t=st(n.params.value),i=new Xr(n.document,{parser:n.params.parse,props:Ne.fromObject({formatter:(e=n.params.format)!==null&&e!==void 0?e:r=>String(r)}),value:t,viewProps:n.viewProps});return new Ti(n.document,{blade:n.blade,props:Ne.fromObject({label:n.params.label}),value:t,valueController:i})},api(n){return!(n.controller instanceof Ti)||!(n.controller.valueController instanceof Xr)?null:new gM(n.controller)}}}();function EM(n){const e=n.createElement("div");return e.classList.add(Ve("dfw")()),n.body&&n.body.appendChild(e),e}function TM(n,e,t){if(n.querySelector(`style[data-tp-style=${e}]`))return;const i=n.createElement("style");i.dataset.tpStyle=e,i.textContent=t,n.head.appendChild(i)}class Vh extends xM{constructor(e){var t,i;const r=e??{},s=(t=r.document)!==null&&t!==void 0?t:Zb(),a=pM(),o=new bM(s,{expanded:r.expanded,blade:yr(),props:Ne.fromObject({title:r.title}),viewProps:Vn.create()});super(o,a),this.pool_=a,this.containerElem_=(i=r.container)!==null&&i!==void 0?i:EM(s),this.containerElem_.appendChild(this.element),this.doc_=s,this.usesDefaultWrapper_=!r.container,this.setUpDefaultPlugins_()}get document(){if(!this.doc_)throw ht.alreadyDisposed();return this.doc_}dispose(){const e=this.containerElem_;if(!e)throw ht.alreadyDisposed();if(this.usesDefaultWrapper_){const t=e.parentElement;t&&t.removeChild(e)}this.containerElem_=null,this.doc_=null,super.dispose()}registerPlugin(e){e.css&&TM(this.document,`plugin-${e.id}`,e.css),("plugin"in e?[e.plugin]:"plugins"in e?e.plugins:[]).forEach(i=>{this.pool_.register(e.id,i)})}setUpDefaultPlugins_(){this.registerPlugin({id:"default",css:'.tp-tbiv_b,.tp-coltxtv_ms,.tp-colswv_b,.tp-ckbv_i,.tp-sglv_i,.tp-mllv_i,.tp-grlv_g,.tp-txtv_i,.tp-p2dpv_p,.tp-colswv_sw,.tp-rotv_b,.tp-fldv_b,.tp-p2dv_b,.tp-btnv_b,.tp-lstv_s{-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:rgba(0,0,0,0);border-width:0;font-family:inherit;font-size:inherit;font-weight:inherit;margin:0;outline:none;padding:0}.tp-p2dv_b,.tp-btnv_b,.tp-lstv_s{background-color:var(--btn-bg);border-radius:var(--bld-br);color:var(--btn-fg);cursor:pointer;display:block;font-weight:bold;height:var(--cnt-usz);line-height:var(--cnt-usz);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tp-p2dv_b:hover,.tp-btnv_b:hover,.tp-lstv_s:hover{background-color:var(--btn-bg-h)}.tp-p2dv_b:focus,.tp-btnv_b:focus,.tp-lstv_s:focus{background-color:var(--btn-bg-f)}.tp-p2dv_b:active,.tp-btnv_b:active,.tp-lstv_s:active{background-color:var(--btn-bg-a)}.tp-p2dv_b:disabled,.tp-btnv_b:disabled,.tp-lstv_s:disabled{opacity:.5}.tp-rotv_c>.tp-cntv.tp-v-lst,.tp-tbpv_c>.tp-cntv.tp-v-lst,.tp-fldv_c>.tp-cntv.tp-v-lst{margin-bottom:calc(-1*var(--cnt-vp))}.tp-rotv_c>.tp-fldv.tp-v-lst .tp-fldv_c,.tp-tbpv_c>.tp-fldv.tp-v-lst .tp-fldv_c,.tp-fldv_c>.tp-fldv.tp-v-lst .tp-fldv_c{border-bottom-left-radius:0}.tp-rotv_c>.tp-fldv.tp-v-lst .tp-fldv_b,.tp-tbpv_c>.tp-fldv.tp-v-lst .tp-fldv_b,.tp-fldv_c>.tp-fldv.tp-v-lst .tp-fldv_b{border-bottom-left-radius:0}.tp-rotv_c>*:not(.tp-v-fst),.tp-tbpv_c>*:not(.tp-v-fst),.tp-fldv_c>*:not(.tp-v-fst){margin-top:var(--cnt-usp)}.tp-rotv_c>.tp-sprv:not(.tp-v-fst),.tp-tbpv_c>.tp-sprv:not(.tp-v-fst),.tp-fldv_c>.tp-sprv:not(.tp-v-fst),.tp-rotv_c>.tp-cntv:not(.tp-v-fst),.tp-tbpv_c>.tp-cntv:not(.tp-v-fst),.tp-fldv_c>.tp-cntv:not(.tp-v-fst){margin-top:var(--cnt-vp)}.tp-rotv_c>.tp-sprv+*:not(.tp-v-hidden),.tp-tbpv_c>.tp-sprv+*:not(.tp-v-hidden),.tp-fldv_c>.tp-sprv+*:not(.tp-v-hidden),.tp-rotv_c>.tp-cntv+*:not(.tp-v-hidden),.tp-tbpv_c>.tp-cntv+*:not(.tp-v-hidden),.tp-fldv_c>.tp-cntv+*:not(.tp-v-hidden){margin-top:var(--cnt-vp)}.tp-rotv_c>.tp-sprv:not(.tp-v-hidden)+.tp-sprv,.tp-tbpv_c>.tp-sprv:not(.tp-v-hidden)+.tp-sprv,.tp-fldv_c>.tp-sprv:not(.tp-v-hidden)+.tp-sprv,.tp-rotv_c>.tp-cntv:not(.tp-v-hidden)+.tp-cntv,.tp-tbpv_c>.tp-cntv:not(.tp-v-hidden)+.tp-cntv,.tp-fldv_c>.tp-cntv:not(.tp-v-hidden)+.tp-cntv{margin-top:0}.tp-tbpv_c>.tp-cntv,.tp-fldv_c>.tp-cntv{margin-left:4px}.tp-tbpv_c>.tp-fldv>.tp-fldv_b,.tp-fldv_c>.tp-fldv>.tp-fldv_b{border-top-left-radius:var(--bld-br);border-bottom-left-radius:var(--bld-br)}.tp-tbpv_c>.tp-fldv.tp-fldv-expanded>.tp-fldv_b,.tp-fldv_c>.tp-fldv.tp-fldv-expanded>.tp-fldv_b{border-bottom-left-radius:0}.tp-tbpv_c .tp-fldv>.tp-fldv_c,.tp-fldv_c .tp-fldv>.tp-fldv_c{border-bottom-left-radius:var(--bld-br)}.tp-tbpv_c>.tp-cntv+.tp-fldv>.tp-fldv_b,.tp-fldv_c>.tp-cntv+.tp-fldv>.tp-fldv_b{border-top-left-radius:0}.tp-tbpv_c>.tp-cntv+.tp-tabv>.tp-tabv_t,.tp-fldv_c>.tp-cntv+.tp-tabv>.tp-tabv_t{border-top-left-radius:0}.tp-tbpv_c>.tp-tabv>.tp-tabv_t,.tp-fldv_c>.tp-tabv>.tp-tabv_t{border-top-left-radius:var(--bld-br)}.tp-tbpv_c .tp-tabv>.tp-tabv_c,.tp-fldv_c .tp-tabv>.tp-tabv_c{border-bottom-left-radius:var(--bld-br)}.tp-rotv_b,.tp-fldv_b{background-color:var(--cnt-bg);color:var(--cnt-fg);cursor:pointer;display:block;height:calc(var(--cnt-usz) + 4px);line-height:calc(var(--cnt-usz) + 4px);overflow:hidden;padding-left:var(--cnt-hp);padding-right:calc(4px + var(--cnt-usz) + var(--cnt-hp));position:relative;text-align:left;text-overflow:ellipsis;white-space:nowrap;width:100%;transition:border-radius .2s ease-in-out .2s}.tp-rotv_b:hover,.tp-fldv_b:hover{background-color:var(--cnt-bg-h)}.tp-rotv_b:focus,.tp-fldv_b:focus{background-color:var(--cnt-bg-f)}.tp-rotv_b:active,.tp-fldv_b:active{background-color:var(--cnt-bg-a)}.tp-rotv_b:disabled,.tp-fldv_b:disabled{opacity:.5}.tp-rotv_m,.tp-fldv_m{background:linear-gradient(to left, var(--cnt-fg), var(--cnt-fg) 2px, transparent 2px, transparent 4px, var(--cnt-fg) 4px);border-radius:2px;bottom:0;content:"";display:block;height:6px;right:calc(var(--cnt-hp) + (var(--cnt-usz) + 4px - 6px)/2 - 2px);margin:auto;opacity:.5;position:absolute;top:0;transform:rotate(90deg);transition:transform .2s ease-in-out;width:6px}.tp-rotv.tp-rotv-expanded .tp-rotv_m,.tp-fldv.tp-fldv-expanded>.tp-fldv_b>.tp-fldv_m{transform:none}.tp-rotv_c,.tp-fldv_c{box-sizing:border-box;height:0;opacity:0;overflow:hidden;padding-bottom:0;padding-top:0;position:relative;transition:height .2s ease-in-out,opacity .2s linear,padding .2s ease-in-out}.tp-rotv.tp-rotv-cpl:not(.tp-rotv-expanded) .tp-rotv_c,.tp-fldv.tp-fldv-cpl:not(.tp-fldv-expanded)>.tp-fldv_c{display:none}.tp-rotv.tp-rotv-expanded .tp-rotv_c,.tp-fldv.tp-fldv-expanded>.tp-fldv_c{opacity:1;padding-bottom:var(--cnt-vp);padding-top:var(--cnt-vp);transform:none;overflow:visible;transition:height .2s ease-in-out,opacity .2s linear .2s,padding .2s ease-in-out}.tp-txtv_i,.tp-p2dpv_p,.tp-colswv_sw{background-color:var(--in-bg);border-radius:var(--bld-br);box-sizing:border-box;color:var(--in-fg);font-family:inherit;height:var(--cnt-usz);line-height:var(--cnt-usz);min-width:0;width:100%}.tp-txtv_i:hover,.tp-p2dpv_p:hover,.tp-colswv_sw:hover{background-color:var(--in-bg-h)}.tp-txtv_i:focus,.tp-p2dpv_p:focus,.tp-colswv_sw:focus{background-color:var(--in-bg-f)}.tp-txtv_i:active,.tp-p2dpv_p:active,.tp-colswv_sw:active{background-color:var(--in-bg-a)}.tp-txtv_i:disabled,.tp-p2dpv_p:disabled,.tp-colswv_sw:disabled{opacity:.5}.tp-lstv,.tp-coltxtv_m{position:relative}.tp-lstv_s{padding:0 20px 0 4px;width:100%}.tp-lstv_m,.tp-coltxtv_mm{bottom:0;margin:auto;pointer-events:none;position:absolute;right:2px;top:0}.tp-lstv_m svg,.tp-coltxtv_mm svg{bottom:0;height:16px;margin:auto;position:absolute;right:0;top:0;width:16px}.tp-lstv_m svg path,.tp-coltxtv_mm svg path{fill:currentColor}.tp-sglv_i,.tp-mllv_i,.tp-grlv_g{background-color:var(--mo-bg);border-radius:var(--bld-br);box-sizing:border-box;color:var(--mo-fg);height:var(--cnt-usz);scrollbar-color:currentColor rgba(0,0,0,0);scrollbar-width:thin;width:100%}.tp-sglv_i::-webkit-scrollbar,.tp-mllv_i::-webkit-scrollbar,.tp-grlv_g::-webkit-scrollbar{height:8px;width:8px}.tp-sglv_i::-webkit-scrollbar-corner,.tp-mllv_i::-webkit-scrollbar-corner,.tp-grlv_g::-webkit-scrollbar-corner{background-color:rgba(0,0,0,0)}.tp-sglv_i::-webkit-scrollbar-thumb,.tp-mllv_i::-webkit-scrollbar-thumb,.tp-grlv_g::-webkit-scrollbar-thumb{background-clip:padding-box;background-color:currentColor;border:rgba(0,0,0,0) solid 2px;border-radius:4px}.tp-pndtxtv,.tp-coltxtv_w{display:flex}.tp-pndtxtv_a,.tp-coltxtv_c{width:100%}.tp-pndtxtv_a+.tp-pndtxtv_a,.tp-coltxtv_c+.tp-pndtxtv_a,.tp-pndtxtv_a+.tp-coltxtv_c,.tp-coltxtv_c+.tp-coltxtv_c{margin-left:2px}.tp-rotv{--bs-bg: var(--tp-base-background-color, hsl(230, 7%, 17%));--bs-br: var(--tp-base-border-radius, 6px);--bs-ff: var(--tp-base-font-family, Roboto Mono, Source Code Pro, Menlo, Courier, monospace);--bs-sh: var(--tp-base-shadow-color, rgba(0, 0, 0, 0.2));--bld-br: var(--tp-blade-border-radius, 2px);--bld-hp: var(--tp-blade-horizontal-padding, 4px);--bld-vw: var(--tp-blade-value-width, 160px);--btn-bg: var(--tp-button-background-color, hsl(230, 7%, 70%));--btn-bg-a: var(--tp-button-background-color-active, #d6d7db);--btn-bg-f: var(--tp-button-background-color-focus, #c8cad0);--btn-bg-h: var(--tp-button-background-color-hover, #bbbcc4);--btn-fg: var(--tp-button-foreground-color, hsl(230, 7%, 17%));--cnt-bg: var(--tp-container-background-color, rgba(187, 188, 196, 0.1));--cnt-bg-a: var(--tp-container-background-color-active, rgba(187, 188, 196, 0.25));--cnt-bg-f: var(--tp-container-background-color-focus, rgba(187, 188, 196, 0.2));--cnt-bg-h: var(--tp-container-background-color-hover, rgba(187, 188, 196, 0.15));--cnt-fg: var(--tp-container-foreground-color, hsl(230, 7%, 75%));--cnt-hp: var(--tp-container-horizontal-padding, 4px);--cnt-vp: var(--tp-container-vertical-padding, 4px);--cnt-usp: var(--tp-container-unit-spacing, 4px);--cnt-usz: var(--tp-container-unit-size, 20px);--in-bg: var(--tp-input-background-color, rgba(187, 188, 196, 0.1));--in-bg-a: var(--tp-input-background-color-active, rgba(187, 188, 196, 0.25));--in-bg-f: var(--tp-input-background-color-focus, rgba(187, 188, 196, 0.2));--in-bg-h: var(--tp-input-background-color-hover, rgba(187, 188, 196, 0.15));--in-fg: var(--tp-input-foreground-color, hsl(230, 7%, 75%));--lbl-fg: var(--tp-label-foreground-color, rgba(187, 188, 196, 0.7));--mo-bg: var(--tp-monitor-background-color, rgba(0, 0, 0, 0.2));--mo-fg: var(--tp-monitor-foreground-color, rgba(187, 188, 196, 0.7));--grv-fg: var(--tp-groove-foreground-color, rgba(187, 188, 196, 0.1))}.tp-btnv_b{width:100%}.tp-btnv_t{text-align:center}.tp-ckbv_l{display:block;position:relative}.tp-ckbv_i{left:0;opacity:0;position:absolute;top:0}.tp-ckbv_w{background-color:var(--in-bg);border-radius:var(--bld-br);cursor:pointer;display:block;height:var(--cnt-usz);position:relative;width:var(--cnt-usz)}.tp-ckbv_w svg{display:block;height:16px;inset:0;margin:auto;opacity:0;position:absolute;width:16px}.tp-ckbv_w svg path{fill:none;stroke:var(--in-fg);stroke-width:2}.tp-ckbv_i:hover+.tp-ckbv_w{background-color:var(--in-bg-h)}.tp-ckbv_i:focus+.tp-ckbv_w{background-color:var(--in-bg-f)}.tp-ckbv_i:active+.tp-ckbv_w{background-color:var(--in-bg-a)}.tp-ckbv_i:checked+.tp-ckbv_w svg{opacity:1}.tp-ckbv.tp-v-disabled .tp-ckbv_w{opacity:.5}.tp-colv{position:relative}.tp-colv_h{display:flex}.tp-colv_s{flex-grow:0;flex-shrink:0;width:var(--cnt-usz)}.tp-colv_t{flex:1;margin-left:4px}.tp-colv_p{height:0;margin-top:0;opacity:0;overflow:hidden;transition:height .2s ease-in-out,opacity .2s linear,margin .2s ease-in-out}.tp-colv.tp-colv-expanded.tp-colv-cpl .tp-colv_p{overflow:visible}.tp-colv.tp-colv-expanded .tp-colv_p{margin-top:var(--cnt-usp);opacity:1}.tp-colv .tp-popv{left:calc(-1*var(--cnt-hp));right:calc(-1*var(--cnt-hp));top:var(--cnt-usz)}.tp-colpv_h,.tp-colpv_ap{margin-left:6px;margin-right:6px}.tp-colpv_h{margin-top:var(--cnt-usp)}.tp-colpv_rgb{display:flex;margin-top:var(--cnt-usp);width:100%}.tp-colpv_a{display:flex;margin-top:var(--cnt-vp);padding-top:calc(var(--cnt-vp) + 2px);position:relative}.tp-colpv_a::before{background-color:var(--grv-fg);content:"";height:2px;left:calc(-1*var(--cnt-hp));position:absolute;right:calc(-1*var(--cnt-hp));top:0}.tp-colpv.tp-v-disabled .tp-colpv_a::before{opacity:.5}.tp-colpv_ap{align-items:center;display:flex;flex:3}.tp-colpv_at{flex:1;margin-left:4px}.tp-svpv{border-radius:var(--bld-br);outline:none;overflow:hidden;position:relative}.tp-svpv.tp-v-disabled{opacity:.5}.tp-svpv_c{cursor:crosshair;display:block;height:calc(var(--cnt-usz)*4);width:100%}.tp-svpv_m{border-radius:100%;border:rgba(255,255,255,.75) solid 2px;box-sizing:border-box;filter:drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));height:12px;margin-left:-6px;margin-top:-6px;pointer-events:none;position:absolute;width:12px}.tp-svpv:focus .tp-svpv_m{border-color:#fff}.tp-hplv{cursor:pointer;height:var(--cnt-usz);outline:none;position:relative}.tp-hplv.tp-v-disabled{opacity:.5}.tp-hplv_c{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAABCAYAAABubagXAAAAQ0lEQVQoU2P8z8Dwn0GCgQEDi2OK/RBgYHjBgIpfovFh8j8YBIgzFGQxuqEgPhaDOT5gOhPkdCxOZeBg+IDFZZiGAgCaSSMYtcRHLgAAAABJRU5ErkJggg==);background-position:left top;background-repeat:no-repeat;background-size:100% 100%;border-radius:2px;display:block;height:4px;left:0;margin-top:-2px;position:absolute;top:50%;width:100%}.tp-hplv_m{border-radius:var(--bld-br);border:rgba(255,255,255,.75) solid 2px;box-shadow:0 0 2px rgba(0,0,0,.1);box-sizing:border-box;height:12px;left:50%;margin-left:-6px;margin-top:-6px;position:absolute;top:50%;width:12px}.tp-hplv:focus .tp-hplv_m{border-color:#fff}.tp-aplv{cursor:pointer;height:var(--cnt-usz);outline:none;position:relative;width:100%}.tp-aplv.tp-v-disabled{opacity:.5}.tp-aplv_b{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:4px 4px;background-position:0 0,2px 2px;border-radius:2px;display:block;height:4px;left:0;margin-top:-2px;overflow:hidden;position:absolute;top:50%;width:100%}.tp-aplv_c{inset:0;position:absolute}.tp-aplv_m{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:12px 12px;background-position:0 0,6px 6px;border-radius:var(--bld-br);box-shadow:0 0 2px rgba(0,0,0,.1);height:12px;left:50%;margin-left:-6px;margin-top:-6px;overflow:hidden;position:absolute;top:50%;width:12px}.tp-aplv_p{border-radius:var(--bld-br);border:rgba(255,255,255,.75) solid 2px;box-sizing:border-box;inset:0;position:absolute}.tp-aplv:focus .tp-aplv_p{border-color:#fff}.tp-colswv{background-color:#fff;background-image:linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%),linear-gradient(to top right, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%);background-size:10px 10px;background-position:0 0,5px 5px;border-radius:var(--bld-br);overflow:hidden}.tp-colswv.tp-v-disabled{opacity:.5}.tp-colswv_sw{border-radius:0}.tp-colswv_b{cursor:pointer;display:block;height:var(--cnt-usz);left:0;position:absolute;top:0;width:var(--cnt-usz)}.tp-colswv_b:focus::after{border:rgba(255,255,255,.75) solid 2px;border-radius:var(--bld-br);content:"";display:block;inset:0;position:absolute}.tp-coltxtv{display:flex;width:100%}.tp-coltxtv_m{margin-right:4px}.tp-coltxtv_ms{border-radius:var(--bld-br);color:var(--lbl-fg);cursor:pointer;height:var(--cnt-usz);line-height:var(--cnt-usz);padding:0 18px 0 4px}.tp-coltxtv_ms:hover{background-color:var(--in-bg-h)}.tp-coltxtv_ms:focus{background-color:var(--in-bg-f)}.tp-coltxtv_ms:active{background-color:var(--in-bg-a)}.tp-coltxtv_mm{color:var(--lbl-fg)}.tp-coltxtv.tp-v-disabled .tp-coltxtv_mm{opacity:.5}.tp-coltxtv_w{flex:1}.tp-dfwv{position:absolute;top:8px;right:8px;width:256px}.tp-fldv{position:relative}.tp-fldv_t{padding-left:4px}.tp-fldv_b:disabled .tp-fldv_m{display:none}.tp-fldv_c{padding-left:4px}.tp-fldv_i{bottom:0;color:var(--cnt-bg);left:0;overflow:hidden;position:absolute;top:calc(var(--cnt-usz) + 4px);width:max(var(--bs-br),4px)}.tp-fldv_i::before{background-color:currentColor;bottom:0;content:"";left:0;position:absolute;top:0;width:4px}.tp-fldv_b:hover+.tp-fldv_i{color:var(--cnt-bg-h)}.tp-fldv_b:focus+.tp-fldv_i{color:var(--cnt-bg-f)}.tp-fldv_b:active+.tp-fldv_i{color:var(--cnt-bg-a)}.tp-fldv.tp-v-disabled>.tp-fldv_i{opacity:.5}.tp-grlv{position:relative}.tp-grlv_g{display:block;height:calc(var(--cnt-usz)*3)}.tp-grlv_g polyline{fill:none;stroke:var(--mo-fg);stroke-linejoin:round}.tp-grlv_t{margin-top:-4px;transition:left .05s,top .05s;visibility:hidden}.tp-grlv_t.tp-grlv_t-a{visibility:visible}.tp-grlv_t.tp-grlv_t-in{transition:none}.tp-grlv.tp-v-disabled .tp-grlv_g{opacity:.5}.tp-grlv .tp-ttv{background-color:var(--mo-fg)}.tp-grlv .tp-ttv::before{border-top-color:var(--mo-fg)}.tp-lblv{align-items:center;display:flex;line-height:1.3;padding-left:var(--cnt-hp);padding-right:var(--cnt-hp)}.tp-lblv.tp-lblv-nol{display:block}.tp-lblv_l{color:var(--lbl-fg);flex:1;-webkit-hyphens:auto;hyphens:auto;overflow:hidden;padding-left:4px;padding-right:16px}.tp-lblv.tp-v-disabled .tp-lblv_l{opacity:.5}.tp-lblv.tp-lblv-nol .tp-lblv_l{display:none}.tp-lblv_v{align-self:flex-start;flex-grow:0;flex-shrink:0;width:var(--bld-vw)}.tp-lblv.tp-lblv-nol .tp-lblv_v{width:100%}.tp-lstv_s{padding:0 20px 0 var(--bld-hp);width:100%}.tp-lstv_m{color:var(--btn-fg)}.tp-sglv_i{padding-left:var(--bld-hp);padding-right:var(--bld-hp)}.tp-sglv.tp-v-disabled .tp-sglv_i{opacity:.5}.tp-mllv_i{display:block;height:calc(var(--cnt-usz)*3);line-height:var(--cnt-usz);padding-left:var(--bld-hp);padding-right:var(--bld-hp);resize:none;white-space:pre}.tp-mllv.tp-v-disabled .tp-mllv_i{opacity:.5}.tp-p2dv{position:relative}.tp-p2dv_h{display:flex}.tp-p2dv_b{height:var(--cnt-usz);margin-right:4px;position:relative;width:var(--cnt-usz)}.tp-p2dv_b svg{display:block;height:16px;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;width:16px}.tp-p2dv_b svg path{stroke:currentColor;stroke-width:2}.tp-p2dv_b svg circle{fill:currentColor}.tp-p2dv_t{flex:1}.tp-p2dv_p{height:0;margin-top:0;opacity:0;overflow:hidden;transition:height .2s ease-in-out,opacity .2s linear,margin .2s ease-in-out}.tp-p2dv.tp-p2dv-expanded .tp-p2dv_p{margin-top:var(--cnt-usp);opacity:1}.tp-p2dv .tp-popv{left:calc(-1*var(--cnt-hp));right:calc(-1*var(--cnt-hp));top:var(--cnt-usz)}.tp-p2dpv{padding-left:calc(var(--cnt-usz) + 4px)}.tp-p2dpv_p{cursor:crosshair;height:0;overflow:hidden;padding-bottom:100%;position:relative}.tp-p2dpv.tp-v-disabled .tp-p2dpv_p{opacity:.5}.tp-p2dpv_g{display:block;height:100%;left:0;pointer-events:none;position:absolute;top:0;width:100%}.tp-p2dpv_ax{opacity:.1;stroke:var(--in-fg);stroke-dasharray:1}.tp-p2dpv_l{opacity:.5;stroke:var(--in-fg);stroke-dasharray:1}.tp-p2dpv_m{border:var(--in-fg) solid 1px;border-radius:50%;box-sizing:border-box;height:4px;margin-left:-2px;margin-top:-2px;position:absolute;width:4px}.tp-p2dpv_p:focus .tp-p2dpv_m{background-color:var(--in-fg);border-width:0}.tp-popv{background-color:var(--bs-bg);border-radius:var(--bs-br);box-shadow:0 2px 4px var(--bs-sh);display:none;max-width:var(--bld-vw);padding:var(--cnt-vp) var(--cnt-hp);position:absolute;visibility:hidden;z-index:1000}.tp-popv.tp-popv-v{display:block;visibility:visible}.tp-sldv.tp-v-disabled{opacity:.5}.tp-sldv_t{box-sizing:border-box;cursor:pointer;height:var(--cnt-usz);margin:0 6px;outline:none;position:relative}.tp-sldv_t::before{background-color:var(--in-bg);border-radius:1px;content:"";display:block;height:2px;inset:0;margin:auto;position:absolute}.tp-sldv_k{height:100%;left:0;position:absolute;top:0}.tp-sldv_k::before{background-color:var(--in-fg);border-radius:1px;content:"";display:block;height:2px;inset:0;margin-bottom:auto;margin-top:auto;position:absolute}.tp-sldv_k::after{background-color:var(--btn-bg);border-radius:var(--bld-br);bottom:0;content:"";display:block;height:12px;margin-bottom:auto;margin-top:auto;position:absolute;right:-6px;top:0;width:12px}.tp-sldv_t:hover .tp-sldv_k::after{background-color:var(--btn-bg-h)}.tp-sldv_t:focus .tp-sldv_k::after{background-color:var(--btn-bg-f)}.tp-sldv_t:active .tp-sldv_k::after{background-color:var(--btn-bg-a)}.tp-sldtxtv{display:flex}.tp-sldtxtv_s{flex:2}.tp-sldtxtv_t{flex:1;margin-left:4px}.tp-tabv{position:relative}.tp-tabv_t{align-items:flex-end;color:var(--cnt-bg);display:flex;overflow:hidden;position:relative}.tp-tabv_t:hover{color:var(--cnt-bg-h)}.tp-tabv_t:has(*:focus){color:var(--cnt-bg-f)}.tp-tabv_t:has(*:active){color:var(--cnt-bg-a)}.tp-tabv_t::before{background-color:currentColor;bottom:0;content:"";height:2px;left:0;pointer-events:none;position:absolute;right:0}.tp-tabv.tp-v-disabled .tp-tabv_t::before{opacity:.5}.tp-tabv.tp-tabv-nop .tp-tabv_t{height:calc(var(--cnt-usz) + 4px);position:relative}.tp-tabv.tp-tabv-nop .tp-tabv_t::before{background-color:var(--cnt-bg);bottom:0;content:"";height:2px;left:0;position:absolute;right:0}.tp-tabv_i{bottom:0;color:var(--cnt-bg);left:0;overflow:hidden;position:absolute;top:calc(var(--cnt-usz) + 4px);width:max(var(--bs-br),4px)}.tp-tabv_i::before{background-color:currentColor;bottom:0;content:"";left:0;position:absolute;top:0;width:4px}.tp-tabv_t:hover+.tp-tabv_i{color:var(--cnt-bg-h)}.tp-tabv_t:has(*:focus)+.tp-tabv_i{color:var(--cnt-bg-f)}.tp-tabv_t:has(*:active)+.tp-tabv_i{color:var(--cnt-bg-a)}.tp-tabv.tp-v-disabled>.tp-tabv_i{opacity:.5}.tp-tbiv{flex:1;min-width:0;position:relative}.tp-tbiv+.tp-tbiv{margin-left:2px}.tp-tbiv+.tp-tbiv.tp-v-disabled::before{opacity:.5}.tp-tbiv_b{display:block;padding-left:calc(var(--cnt-hp) + 4px);padding-right:calc(var(--cnt-hp) + 4px);position:relative;width:100%}.tp-tbiv_b:disabled{opacity:.5}.tp-tbiv_b::before{background-color:var(--cnt-bg);content:"";inset:0 0 2px;pointer-events:none;position:absolute}.tp-tbiv_b:hover::before{background-color:var(--cnt-bg-h)}.tp-tbiv_b:focus::before{background-color:var(--cnt-bg-f)}.tp-tbiv_b:active::before{background-color:var(--cnt-bg-a)}.tp-tbiv_t{color:var(--cnt-fg);height:calc(var(--cnt-usz) + 4px);line-height:calc(var(--cnt-usz) + 4px);opacity:.5;overflow:hidden;position:relative;text-overflow:ellipsis}.tp-tbiv.tp-tbiv-sel .tp-tbiv_t{opacity:1}.tp-tbpv_c{padding-bottom:var(--cnt-vp);padding-left:4px;padding-top:var(--cnt-vp)}.tp-txtv{position:relative}.tp-txtv_i{padding-left:var(--bld-hp);padding-right:var(--bld-hp)}.tp-txtv.tp-txtv-fst .tp-txtv_i{border-bottom-right-radius:0;border-top-right-radius:0}.tp-txtv.tp-txtv-mid .tp-txtv_i{border-radius:0}.tp-txtv.tp-txtv-lst .tp-txtv_i{border-bottom-left-radius:0;border-top-left-radius:0}.tp-txtv.tp-txtv-num .tp-txtv_i{text-align:right}.tp-txtv.tp-txtv-drg .tp-txtv_i{opacity:.3}.tp-txtv_k{cursor:pointer;height:100%;left:calc(var(--bld-hp) - 5px);position:absolute;top:0;width:12px}.tp-txtv_k::before{background-color:var(--in-fg);border-radius:1px;bottom:0;content:"";height:calc(var(--cnt-usz) - 4px);left:50%;margin-bottom:auto;margin-left:-1px;margin-top:auto;opacity:.1;position:absolute;top:0;transition:border-radius .1s,height .1s,transform .1s,width .1s;width:2px}.tp-txtv_k:hover::before,.tp-txtv.tp-txtv-drg .tp-txtv_k::before{opacity:1}.tp-txtv.tp-txtv-drg .tp-txtv_k::before{border-radius:50%;height:4px;transform:translateX(-1px);width:4px}.tp-txtv_g{bottom:0;display:block;height:8px;left:50%;margin:auto;overflow:visible;pointer-events:none;position:absolute;top:0;visibility:hidden;width:100%}.tp-txtv.tp-txtv-drg .tp-txtv_g{visibility:visible}.tp-txtv_gb{fill:none;stroke:var(--in-fg);stroke-dasharray:1}.tp-txtv_gh{fill:none;stroke:var(--in-fg)}.tp-txtv .tp-ttv{margin-left:6px;visibility:hidden}.tp-txtv.tp-txtv-drg .tp-ttv{visibility:visible}.tp-ttv{background-color:var(--in-fg);border-radius:var(--bld-br);color:var(--bs-bg);padding:2px 4px;pointer-events:none;position:absolute;transform:translate(-50%, -100%)}.tp-ttv::before{border-color:var(--in-fg) rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0);border-style:solid;border-width:2px;box-sizing:border-box;content:"";font-size:.9em;height:4px;left:50%;margin-left:-2px;position:absolute;top:100%;width:4px}.tp-rotv{background-color:var(--bs-bg);border-radius:var(--bs-br);box-shadow:0 2px 4px var(--bs-sh);font-family:var(--bs-ff);font-size:11px;font-weight:500;line-height:1;text-align:left}.tp-rotv_b{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br);border-top-left-radius:var(--bs-br);border-top-right-radius:var(--bs-br);padding-left:calc(4px + var(--cnt-usz) + var(--cnt-hp));text-align:center}.tp-rotv.tp-rotv-expanded .tp-rotv_b{border-bottom-left-radius:0;border-bottom-right-radius:0;transition-delay:0s;transition-duration:0s}.tp-rotv.tp-rotv-not>.tp-rotv_b{display:none}.tp-rotv_b:disabled .tp-rotv_m{display:none}.tp-rotv_c>.tp-fldv.tp-v-lst>.tp-fldv_c{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br)}.tp-rotv_c>.tp-fldv.tp-v-lst>.tp-fldv_i{border-bottom-left-radius:var(--bs-br)}.tp-rotv_c>.tp-fldv.tp-v-lst:not(.tp-fldv-expanded)>.tp-fldv_b{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br)}.tp-rotv_c>.tp-fldv.tp-v-lst.tp-fldv-expanded>.tp-fldv_b{transition-delay:0s;transition-duration:0s}.tp-rotv_c .tp-fldv.tp-v-vlst:not(.tp-fldv-expanded)>.tp-fldv_b{border-bottom-right-radius:var(--bs-br)}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-fldv.tp-v-fst{margin-top:calc(-1*var(--cnt-vp))}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-fldv.tp-v-fst>.tp-fldv_b{border-top-left-radius:var(--bs-br);border-top-right-radius:var(--bs-br)}.tp-rotv_c>.tp-tabv.tp-v-lst>.tp-tabv_c{border-bottom-left-radius:var(--bs-br);border-bottom-right-radius:var(--bs-br)}.tp-rotv_c>.tp-tabv.tp-v-lst>.tp-tabv_i{border-bottom-left-radius:var(--bs-br)}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-tabv.tp-v-fst{margin-top:calc(-1*var(--cnt-vp))}.tp-rotv.tp-rotv-not .tp-rotv_c>.tp-tabv.tp-v-fst>.tp-tabv_t{border-top-left-radius:var(--bs-br);border-top-right-radius:var(--bs-br)}.tp-rotv.tp-v-disabled,.tp-rotv .tp-v-disabled{pointer-events:none}.tp-rotv.tp-v-hidden,.tp-rotv .tp-v-hidden{display:none}.tp-sprv_r{background-color:var(--grv-fg);border-width:0;display:block;height:2px;margin:0;width:100%}.tp-sprv.tp-v-disabled .tp-sprv_r{opacity:.5}',plugins:[_M,wM,SM,Qu,MM]})}}new $u("4.0.5");const Ld={camera:{autoOrbit:!1,orbitSpeed:.05},scene:{background:"#06080c",showGrid:!1},timeOfDay:{t01:.5,paused:!1},altitude:{scaleFactor:5},layers:{globe:!0,atmosphere:!0,ocean:!0,clouds:!0,cities:!0,airports:!0,routeScaffold:!0,trails:!0,planes:!0,postFx:!0},airplanes:{speed:.15,targetInFlight:2200,scaffoldOpacity:.04,trailOpacity:.05},materials:{globe:{ambient:.3,nightTint:"#141a29",lerpColorFire:"#1a1014",lerpColorIce:"#d4ecff",lerpColorInfection:"#bb33cc",lerpColorPollution:"#7a6a3a",lerpStrengthFire:1,lerpStrengthIce:1,lerpStrengthInfection:1,lerpStrengthPollution:1,biomeStrength:.85,snowLineStrength:.55,seasonOffsetC:0,alpineStrength:.7},atmosphere:{rayleighScale:2.5,mieScale:1,sunDiskSize:.18,exposure:2.5},ocean:{waveAmplitude:150,waveSpeed:1,waveSteepness:.5,fresnelStrength:1,deepColor:"#0a2a4f",shallowColor:"#3da6c2",currentStrength:1,streamlinesEnabled:!0,strongJetsOnly:!1},clouds:{density:.1,coverage:.5,beer:1.4,henyey:.4,advection:14},cities:{baseRadiusKm:30,minRadiusKm:5,maxRadiusKm:80,minPopulation:0,falloffStrength:3,gridDensity:10,blockThreshold:.25,outlineMin:.01,outlineMax:.06,nightBrightness:1.5,dayContrast:.5,opacity:.65},postFx:{bloomThreshold:.85,bloomStrength:.6,vignette:.35,gradeTint:"#f3eee0"}},pick:{lastPick:"(click on the globe)"}};function CM(n=Ld){const e=document.getElementById("tweakpane-host"),t=e?new Vh({title:"earth-destroyer",expanded:!0,container:e}):new Vh({title:"earth-destroyer",expanded:!0}),i=t.addFolder({title:"Camera"});i.addBinding(n.camera,"autoOrbit"),i.addBinding(n.camera,"orbitSpeed",{min:0,max:.5,step:.001});const r=t.addFolder({title:"Scene"});r.addBinding(n.scene,"background"),r.addBinding(n.scene,"showGrid",{disabled:!0,label:"showGrid (n/a)"}),t.addFolder({title:"Time of day"}).addBinding(n.timeOfDay,"paused",{label:"pause"});const a=t.addFolder({title:"Layers"});a.addBinding(n.layers,"globe"),a.addBinding(n.layers,"airports",{label:"airports"}),a.addBinding(n.layers,"routeScaffold",{label:"routes"}),a.addBinding(n.layers,"postFx",{disabled:!0,label:"postFx (n/a)"});const o=t.addFolder({title:"Airplanes"});o.addBinding(n.airplanes,"speed",{min:0,max:10,step:.05,label:"speed (h/sec)"}),o.addBinding(n.airplanes,"targetInFlight",{min:0,max:4e3,step:50,label:"in-flight target"}),o.addBinding(n.airplanes,"scaffoldOpacity",{min:0,max:.5,step:.005,label:"route alpha"}),o.addBinding(n.airplanes,"trailOpacity",{min:0,max:.3,step:.001,label:"trail alpha"});const l=t.addFolder({title:"Materials"}),c=l.addFolder({title:"Atmosphere",expanded:!1});c.addBinding(n.materials.atmosphere,"rayleighScale",{min:0,max:5,step:.05}),c.addBinding(n.materials.atmosphere,"mieScale",{min:0,max:3,step:.05}),c.addBinding(n.materials.atmosphere,"sunDiskSize",{min:.001,max:.25,step:.005}),c.addBinding(n.materials.atmosphere,"exposure",{min:.1,max:6,step:.05});const h=l.addFolder({title:"Ocean",expanded:!1});h.addBinding(n.materials.ocean,"waveAmplitude",{min:0,max:600,step:5}),h.addBinding(n.materials.ocean,"waveSpeed",{min:0,max:5,step:.05}),h.addBinding(n.materials.ocean,"waveSteepness",{min:0,max:1,step:.01}),h.addBinding(n.materials.ocean,"fresnelStrength",{min:0,max:3,step:.05}),h.addBinding(n.materials.ocean,"deepColor"),h.addBinding(n.materials.ocean,"shallowColor"),h.addBinding(n.materials.ocean,"currentStrength",{min:0,max:3,step:.05,label:"currents"}),h.addBinding(n.materials.ocean,"streamlinesEnabled",{label:"streamlines"}),h.addBinding(n.materials.ocean,"strongJetsOnly",{label:"jets only"});const u=l.addFolder({title:"Clouds",expanded:!1});u.addBinding(n.materials.clouds,"density",{min:0,max:2,step:.01}),u.addBinding(n.materials.clouds,"coverage",{min:0,max:1,step:.01}),u.addBinding(n.materials.clouds,"beer",{min:0,max:4,step:.05}),u.addBinding(n.materials.clouds,"henyey",{min:-.95,max:.95,step:.01}),u.addBinding(n.materials.clouds,"advection",{min:0,max:100,step:.5});const d=l.addFolder({title:"Cities",expanded:!1});d.addBinding(n.materials.cities,"baseRadiusKm",{min:5,max:60,step:1}),d.addBinding(n.materials.cities,"minRadiusKm",{min:1,max:20,step:.5}),d.addBinding(n.materials.cities,"maxRadiusKm",{min:40,max:200,step:1}),d.addBinding(n.materials.cities,"minPopulation",{min:0,max:1e6,step:1e3}),d.addBinding(n.materials.cities,"falloffStrength",{min:1,max:6,step:.1}),d.addBinding(n.materials.cities,"gridDensity",{min:4,max:20,step:1}),d.addBinding(n.materials.cities,"blockThreshold",{min:0,max:.6,step:.01}),d.addBinding(n.materials.cities,"outlineMin",{min:0,max:.05,step:.001}),d.addBinding(n.materials.cities,"outlineMax",{min:.02,max:.2,step:.005}),d.addBinding(n.materials.cities,"nightBrightness",{min:0,max:3,step:.05}),d.addBinding(n.materials.cities,"dayContrast",{min:0,max:1,step:.01}),d.addBinding(n.materials.cities,"opacity",{min:0,max:1,step:.01});const m=l.addFolder({title:"PostFX (n/a)",expanded:!1});return m.disabled=!0,m.addBinding(n.materials.postFx,"bloomThreshold",{min:0,max:2,step:.01}),m.addBinding(n.materials.postFx,"bloomStrength",{min:0,max:3,step:.01}),m.addBinding(n.materials.postFx,"vignette",{min:0,max:1.5,step:.01}),m.addBinding(n.materials.postFx,"gradeTint"),t.addFolder({title:"Pick",expanded:!0}).addBinding(n.pick,"lastPick",{readonly:!0,multiline:!0,rows:8}),{pane:t,state:n,dispose:()=>t.dispose()}}const Id=document.getElementById("app"),nr=document.getElementById("loading");if(!Id)throw new Error("#app host element not found in index.html");async function AM(){const{world:n,sim:e}=await ib(),t=zx(),i=new K_(Id,t);t.attachWorld(n,i.canvas);const r=CM(Ld),s=document.getElementById("time-clock"),a=document.getElementById("time-clock-svg"),o=document.getElementById("time-clock-hand"),l=document.getElementById("time-clock-ticks"),c=document.getElementById("time-readout"),h=document.getElementById("time-pause"),u=document.getElementById("tweakpane-toggle"),d=document.getElementById("tweakpane-host"),m=document.getElementById("season-slider"),g=document.getElementById("season-readout"),x=document.getElementById("season-control"),p=document.getElementById("altitude-slider"),f=document.getElementById("altitude-readout"),M=document.getElementById("toggle-clouds"),y=document.getElementById("toggle-ocean"),S=document.getElementById("toggle-atmosphere"),N=document.getElementById("toggle-cities"),A=document.getElementById("toggle-planes"),T=(C,V)=>{C&&(C.checked=r.state.layers[V],C.addEventListener("change",()=>{r.state.layers[V]=C.checked}))};T(M,"clouds"),T(y,"ocean"),T(S,"atmosphere"),T(N,"cities"),A&&(A.checked=r.state.layers.planes&&r.state.layers.trails,A.addEventListener("change",()=>{r.state.layers.planes=A.checked,r.state.layers.trails=A.checked}));const F=C=>{const V=Math.max(-1,Math.min(1,C/30));let U,ee,Q;if(V>=0)U=Math.round(230+25*V),ee=Math.round(236+-159*V),Q=Math.round(246+-185*V);else{const Z=-V;U=Math.round(230+-152*Z),ee=Math.round(236+-68*Z),Q=Math.round(246+9*Z)}x&&x.style.setProperty("--season-color",`rgb(${U}, ${ee}, ${Q})`)},K=C=>{if(g){const V=C>0?"+":"";g.textContent=`${V}${C.toFixed(1)}°`}F(C)};if(l){const C="http://www.w3.org/2000/svg";for(let V=0;V<24;V++){const U=document.createElementNS(C,"line"),ee=V%6===0;U.setAttribute("x1","0"),U.setAttribute("y1","-44"),U.setAttribute("x2","0"),U.setAttribute("y2",ee?"-37":"-40"),ee&&U.setAttribute("class","major"),U.setAttribute("transform",`rotate(${V*15})`),l.appendChild(U)}}const v=C=>{const V=C*24,U=Math.floor(V)%24,ee=Math.floor((V-Math.floor(V))*6)*10;return`${String(U).padStart(2,"0")}:${String(ee).padStart(2,"0")}`},w=C=>{o&&o.setAttribute("transform",`rotate(${C*360})`),c&&(c.textContent=v(C)),s&&s.setAttribute("aria-valuenow",(C*24).toFixed(1))};w(r.state.timeOfDay.t01);let H=!1;if(s&&a){const C=U=>{const ee=a.getBoundingClientRect(),Q=ee.left+ee.width/2,Z=ee.top+ee.height/2;let ge=Math.atan2(U.clientX-Q,-(U.clientY-Z));ge<0&&(ge+=Math.PI*2);const Pe=ge/(Math.PI*2);r.state.timeOfDay.t01=Pe,w(Pe)};s.addEventListener("pointerdown",U=>{H=!0,s.setPointerCapture(U.pointerId),C(U)}),s.addEventListener("pointermove",U=>{H&&C(U)});const V=U=>{H=!1,s.hasPointerCapture(U.pointerId)&&s.releasePointerCapture(U.pointerId)};s.addEventListener("pointerup",V),s.addEventListener("pointercancel",V)}const G=()=>{h&&(h.textContent=r.state.timeOfDay.paused?"▶":"⏸")};G(),h&&h.addEventListener("click",()=>{r.state.timeOfDay.paused=!r.state.timeOfDay.paused,G(),r.pane.refresh()}),u&&d&&u.addEventListener("click",()=>{d.classList.toggle("open")}),d&&d.querySelectorAll('input[type="checkbox"]').forEach(C=>{const V=C.closest(".tp-lblv")??C.closest(".tp-bldv");V&&(V.style.cursor="pointer",V.addEventListener("click",U=>{if(C.disabled)return;const ee=U.target;!ee||ee===C||ee.closest(".tp-ckbv_l, .tp-ckbv_w")||C.click()}))}),m&&(m.value=String(r.state.materials.globe.seasonOffsetC),K(r.state.materials.globe.seasonOffsetC),m.addEventListener("input",()=>{const C=parseFloat(m.value);r.state.materials.globe.seasonOffsetC=C,K(C)}));const X=C=>{f&&(f.textContent=`${C.toFixed(1)}×`)};p&&(p.value=String(r.state.altitude.scaleFactor),X(r.state.altitude.scaleFactor),p.addEventListener("input",()=>{const C=parseFloat(p.value);r.state.altitude.scaleFactor=C,X(C)}));let z=performance.now();requestAnimationFrame(function C(V){const U=Math.min(100,V-z),ee=U/1e3;if(z=V,e.tick(U),i.tick(ee,r.state),H||w(r.state.timeOfDay.t01),h){const Q=r.state.timeOfDay.paused?"▶":"⏸";h.textContent!==Q&&(h.textContent=Q)}if(m&&document.activeElement!==m){const Q=r.state.materials.globe.seasonOffsetC;parseFloat(m.value)!==Q&&(m.value=String(Q),K(Q))}if(p&&document.activeElement!==p){const Q=r.state.altitude.scaleFactor;parseFloat(p.value)!==Q&&(p.value=String(Q),X(Q))}if(A){const Q=r.state.layers.planes&&r.state.layers.trails;A.checked!==Q&&(A.checked=Q)}requestAnimationFrame(C)}),nr&&nr.classList.add("hidden")}AM().catch(n=>{nr&&(nr.classList.remove("hidden"),nr.classList.add("error"),nr.textContent=`boot failed:
${n instanceof Error?n.stack??n.message:String(n)}`),console.error(n)});
//# sourceMappingURL=index-VKCO05ms.js.map
