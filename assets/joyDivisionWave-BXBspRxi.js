import"./_commonjsHelpers-C5lxYuLu.js";import{aN as at,F as je,aO as ye,n as q,aP as st,am as we,an as Re,w as R,c as ct,aQ as Qe,V as Ye,d as Ke,aE as J,aR as Ze,v as et,M as j,aI as lt,j as h,r as w,aS as ut}from"./three.core-CpAfgIRs.js";import{S as me,U as he,C as dt,a as ft}from"./react-three-fiber.esm-NEIvi6JZ.js";import{Line2NodeMaterial as Te,WebGPURenderer as pt}from"./three.webgpu-B_5OqU_T.js";import{O as mt}from"./OrbitControls-BtCPtTLh.js";const Pe=new we,ce=new R;class Ce extends at{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],n=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],o=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(o),this.setAttribute("position",new je(e,3)),this.setAttribute("uv",new je(n,2))}applyMatrix4(e){const n=this.attributes.instanceStart,o=this.attributes.instanceEnd;return n!==void 0&&(n.applyMatrix4(e),o.applyMatrix4(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const o=new ye(n,6,1);return this.setAttribute("instanceStart",new q(o,3,0)),this.setAttribute("instanceEnd",new q(o,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));const o=new ye(n,6,1);return this.setAttribute("instanceColorStart",new q(o,3,0)),this.setAttribute("instanceColorEnd",new q(o,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new st(e.geometry)),this}fromLineSegments(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new we);const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;e!==void 0&&n!==void 0&&(this.boundingBox.setFromBufferAttribute(e),Pe.setFromBufferAttribute(n),this.boundingBox.union(Pe))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Re),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,n=this.attributes.instanceEnd;if(e!==void 0&&n!==void 0){const o=this.boundingSphere.center;this.boundingBox.getCenter(o);let t=0;for(let i=0,s=e.count;i<s;i++)ce.fromBufferAttribute(e,i),t=Math.max(t,o.distanceToSquared(ce)),ce.fromBufferAttribute(n,i),t=Math.max(t,o.distanceToSquared(ce));this.boundingSphere.radius=Math.sqrt(t),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}}he.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new Ye(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};me.line={uniforms:Qe.merge([he.common,he.fog,he.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};class We extends ct{constructor(e){super({type:"LineMaterial",uniforms:Qe.clone(me.line.uniforms),vertexShader:me.line.vertexShader,fragmentShader:me.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(e){e===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return"USE_DASH"in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}}const Ue=new J,ke=new R,Ne=new R,M=new J,_=new J,k=new J,Ee=new R,Me=new et,D=new Ze,Ie=new R,le=new we,ue=new Re,N=new J;let $,Q;function Fe(r,e,n){return N.set(0,0,-e,1).applyMatrix4(r.projectionMatrix),N.multiplyScalar(1/N.w),N.x=Q/n.width,N.y=Q/n.height,N.applyMatrix4(r.projectionMatrixInverse),N.multiplyScalar(1/N.w),Math.abs(Math.max(N.x,N.y))}function ht(r,e){const n=r.matrixWorld,o=r.geometry,t=o.attributes.instanceStart,i=o.attributes.instanceEnd,s=Math.min(o.instanceCount,t.count);for(let a=0,u=s;a<u;a++){D.start.fromBufferAttribute(t,a),D.end.fromBufferAttribute(i,a),D.applyMatrix4(n);const d=new R,l=new R;$.distanceSqToSegment(D.start,D.end,l,d),l.distanceTo(d)<Q*.5&&e.push({point:l,pointOnLine:d,distance:$.origin.distanceTo(l),object:r,face:null,faceIndex:a,uv:null,uv1:null})}}function yt(r,e,n){const o=e.projectionMatrix,i=r.material.resolution,s=r.matrixWorld,a=r.geometry,u=a.attributes.instanceStart,d=a.attributes.instanceEnd,l=Math.min(a.instanceCount,u.count),p=-e.near;$.at(1,k),k.w=1,k.applyMatrix4(e.matrixWorldInverse),k.applyMatrix4(o),k.multiplyScalar(1/k.w),k.x*=i.x/2,k.y*=i.y/2,k.z=0,Ee.copy(k),Me.multiplyMatrices(e.matrixWorldInverse,s);for(let v=0,T=l;v<T;v++){if(M.fromBufferAttribute(u,v),_.fromBufferAttribute(d,v),M.w=1,_.w=1,M.applyMatrix4(Me),_.applyMatrix4(Me),M.z>p&&_.z>p)continue;if(M.z>p){const m=M.z-_.z,x=(M.z-p)/m;M.lerp(_,x)}else if(_.z>p){const m=_.z-M.z,x=(_.z-p)/m;_.lerp(M,x)}M.applyMatrix4(o),_.applyMatrix4(o),M.multiplyScalar(1/M.w),_.multiplyScalar(1/_.w),M.x*=i.x/2,M.y*=i.y/2,_.x*=i.x/2,_.y*=i.y/2,D.start.copy(M),D.start.z=0,D.end.copy(_),D.end.z=0;const O=D.closestPointToPointParameter(Ee,!0);D.at(O,Ie);const E=j.lerp(M.z,_.z,O),G=E>=-1&&E<=1,g=Ee.distanceTo(Ie)<Q*.5;if(G&&g){D.start.fromBufferAttribute(u,v),D.end.fromBufferAttribute(d,v),D.start.applyMatrix4(s),D.end.applyMatrix4(s);const m=new R,x=new R;$.distanceSqToSegment(D.start,D.end,x,m),n.push({point:x,pointOnLine:m,distance:$.origin.distanceTo(x),object:r,face:null,faceIndex:v,uv:null,uv1:null})}}}let wt=class extends Ke{constructor(e=new Ce,n=new We({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,o=e.attributes.instanceEnd,t=new Float32Array(2*n.count);for(let s=0,a=0,u=n.count;s<u;s++,a+=2)ke.fromBufferAttribute(n,s),Ne.fromBufferAttribute(o,s),t[a]=a===0?0:t[a-1],t[a+1]=t[a]+ke.distanceTo(Ne);const i=new ye(t,2,1);return e.setAttribute("instanceDistanceStart",new q(i,1,0)),e.setAttribute("instanceDistanceEnd",new q(i,1,1)),this}raycast(e,n){const o=this.material.worldUnits,t=e.camera;t===null&&!o&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const i=e.params.Line2!==void 0&&e.params.Line2.threshold||0;$=e.ray;const s=this.matrixWorld,a=this.geometry,u=this.material;Q=u.linewidth+i,a.boundingSphere===null&&a.computeBoundingSphere(),ue.copy(a.boundingSphere).applyMatrix4(s);let d;if(o)d=Q*.5;else{const p=Math.max(t.near,ue.distanceToPoint($.origin));d=Fe(t,p,u.resolution)}if(ue.radius+=d,$.intersectsSphere(ue)===!1)return;a.boundingBox===null&&a.computeBoundingBox(),le.copy(a.boundingBox).applyMatrix4(s);let l;if(o)l=Q*.5;else{const p=Math.max(t.near,le.distanceToPoint($.origin));l=Fe(t,p,u.resolution)}le.expandByScalar(l),$.intersectsBox(le)!==!1&&(o?ht(this,n):yt(this,t,n))}onBeforeRender(e){const n=this.material.uniforms;n&&n.resolution&&(e.getViewport(Ue),this.material.uniforms.resolution.value.set(Ue.z,Ue.w))}};class Be extends Ce{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const n=e.length-3,o=new Float32Array(2*n);for(let t=0;t<n;t+=3)o[2*t]=e[t],o[2*t+1]=e[t+1],o[2*t+2]=e[t+2],o[2*t+3]=e[t+3],o[2*t+4]=e[t+4],o[2*t+5]=e[t+5];return super.setPositions(o),this}setColors(e){const n=e.length-3,o=new Float32Array(2*n);for(let t=0;t<n;t+=3)o[2*t]=e[t],o[2*t+1]=e[t+1],o[2*t+2]=e[t+2],o[2*t+3]=e[t+3],o[2*t+4]=e[t+4],o[2*t+5]=e[t+5];return super.setColors(o),this}setFromPoints(e){const n=e.length-1,o=new Float32Array(6*n);for(let t=0;t<n;t++)o[6*t]=e[t].x,o[6*t+1]=e[t].y,o[6*t+2]=e[t].z||0,o[6*t+3]=e[t+1].x,o[6*t+4]=e[t+1].y,o[6*t+5]=e[t+1].z||0;return super.setPositions(o),this}fromLine(e){const n=e.geometry;return this.setPositions(n.attributes.position.array),this}}let vt=class extends wt{constructor(e=new Be,n=new We({color:Math.random()*16777215})){super(e,n),this.isLine2=!0,this.type="Line2"}};const $e=new R,He=new R,L=new J,A=new J,I=new J,_e=new R,Le=new et,z=new Ze,Je=new R,de=new we,fe=new Re,F=new J,Ae=new J;let H,Y;function Ge(r,e,n){return F.set(0,0,-e,1).applyMatrix4(r.projectionMatrix),F.multiplyScalar(1/F.w),F.x=Y/n.width,F.y=Y/n.height,F.applyMatrix4(r.projectionMatrixInverse),F.multiplyScalar(1/F.w),Math.abs(Math.max(F.x,F.y))}function gt(r,e){const n=r.matrixWorld,o=r.geometry,t=o.attributes.instanceStart,i=o.attributes.instanceEnd,s=Math.min(o.instanceCount,t.count);for(let a=0,u=s;a<u;a++){z.start.fromBufferAttribute(t,a),z.end.fromBufferAttribute(i,a),z.applyMatrix4(n);const d=new R,l=new R;H.distanceSqToSegment(z.start,z.end,l,d),l.distanceTo(d)<Y*.5&&e.push({point:l,pointOnLine:d,distance:H.origin.distanceTo(l),object:r,face:null,faceIndex:a,uv:null,uv1:null})}}function St(r,e,n){const o=e.projectionMatrix,t=r.matrixWorld,i=r._resolution,s=r.geometry,a=s.attributes.instanceStart,u=s.attributes.instanceEnd,d=Math.min(s.instanceCount,a.count),l=-e.near;H.at(1,I),I.w=1,I.applyMatrix4(e.matrixWorldInverse),I.applyMatrix4(o),I.multiplyScalar(1/I.w),I.x*=i.x/2,I.y*=i.y/2,I.z=0,_e.copy(I),Le.multiplyMatrices(e.matrixWorldInverse,t);for(let p=0,v=d;p<v;p++){if(L.fromBufferAttribute(a,p),A.fromBufferAttribute(u,p),L.w=1,A.w=1,L.applyMatrix4(Le),A.applyMatrix4(Le),L.z>l&&A.z>l)continue;if(L.z>l){const g=L.z-A.z,m=(L.z-l)/g;L.lerp(A,m)}else if(A.z>l){const g=A.z-L.z,m=(A.z-l)/g;A.lerp(L,m)}L.applyMatrix4(o),A.applyMatrix4(o),L.multiplyScalar(1/L.w),A.multiplyScalar(1/A.w),L.x*=i.x/2,L.y*=i.y/2,A.x*=i.x/2,A.y*=i.y/2,z.start.copy(L),z.start.z=0,z.end.copy(A),z.end.z=0;const b=z.closestPointToPointParameter(_e,!0);z.at(b,Je);const O=j.lerp(L.z,A.z,b),E=O>=-1&&O<=1,G=_e.distanceTo(Je)<Y*.5;if(E&&G){z.start.fromBufferAttribute(a,p),z.end.fromBufferAttribute(u,p),z.start.applyMatrix4(t),z.end.applyMatrix4(t);const g=new R,m=new R;H.distanceSqToSegment(z.start,z.end,m,g),n.push({point:m,pointOnLine:g,distance:H.origin.distanceTo(m),object:r,face:null,faceIndex:p,uv:null,uv1:null})}}}class xt extends Ke{constructor(e=new Ce,n=new Te({color:Math.random()*16777215})){super(e,n),this.isLineSegments2=!0,this.type="LineSegments2",this._resolution=new Ye}computeLineDistances(){const e=this.geometry,n=e.attributes.instanceStart,o=e.attributes.instanceEnd,t=new Float32Array(2*n.count);for(let s=0,a=0,u=n.count;s<u;s++,a+=2)$e.fromBufferAttribute(n,s),He.fromBufferAttribute(o,s),t[a]=a===0?0:t[a-1],t[a+1]=t[a]+$e.distanceTo(He);const i=new ye(t,2,1);return e.setAttribute("instanceDistanceStart",new q(i,1,0)),e.setAttribute("instanceDistanceEnd",new q(i,1,1)),this}onBeforeRender(e){e.getViewport(Ae),this._resolution.set(Ae.z,Ae.w)}raycast(e,n){const o=this.material.worldUnits,t=e.camera;t===null&&!o&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const i=e.params.Line2!==void 0&&e.params.Line2.threshold||0;H=e.ray;const s=this.matrixWorld,a=this.geometry;Y=this.material.linewidth+i,a.boundingSphere===null&&a.computeBoundingSphere(),fe.copy(a.boundingSphere).applyMatrix4(s);let d;if(o)d=Y*.5;else{const p=Math.max(t.near,fe.distanceToPoint(H.origin));d=Ge(t,p,this._resolution)}if(fe.radius+=d,H.intersectsSphere(fe)===!1)return;a.boundingBox===null&&a.computeBoundingBox(),de.copy(a.boundingBox).applyMatrix4(s);let l;if(o)l=Y*.5;else{const p=Math.max(t.near,de.distanceToPoint(H.origin));l=Ge(t,p,this._resolution)}de.expandByScalar(l),H.intersectsBox(de)!==!1&&(o?gt(this,n):St(this,t,n))}}class bt extends xt{constructor(e=new Be,n=new Te({color:Math.random()*16777215})){super(e,n),this.isLine2=!0,this.type="Line2"}}const K=2048,Ut=/\.(aac|aif|aiff|flac|m4a|mp2|mp3|oga|ogg|opus|wav|weba|webm|mp4)(?:$|[?#])/i,Et=/\.(avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i,Mt=/\.(json)(?:$|[?#])/i,_t=/(^|\.)soundcloud\.com$/i,Lt=/(^|\.)on\.soundcloud\.com$/i,Ve="/api/soundcloud-resolve";async function At(r,e){const n=await r.arrayBuffer(),o=await tt(n,e);return{title:r.name,sourceType:"audio",samples:nt(o),playbackUrl:URL.createObjectURL(r),note:"Loaded from a local file."}}async function Dt(r,e){const n=zt(r);return Ct(n)?Rt(n,e):ze(n,e,{title:X(n),sourceUrl:n.toString(),playbackUrl:n.toString(),attributionUrl:n.toString()})}function zt(r){const e=r.trim();if(!e)throw new Error("Enter a URL for an audio file, waveform asset, or SoundCloud track.");try{const n=new URL(e,window.location.href);if(!["http:","https:"].includes(n.protocol))throw new Error;return n}catch{throw new Error("Enter a valid HTTP or HTTPS URL.")}}async function Rt(r,e){const n=Ve;{const o=new URL(n,window.location.origin);o.searchParams.set("url",r.toString());let t;try{t=await Tt(o.toString())}catch(i){throw i instanceof Error&&i.message.includes("404")&&n===Ve?new Error("No SoundCloud resolver is deployed at `/api/soundcloud-resolve` on this host. GitHub Pages cannot run it. Deploy this repo somewhere with serverless support, or point `VITE_SOUNDCLOUD_RESOLVER_URL` at a deployed resolver."):i}if(t.waveformUrl){const i=await ze(new URL(t.waveformUrl,o),e,{title:t.title??X(r),sourceUrl:r.toString(),playbackUrl:t.playbackUrl,attributionUrl:t.attributionUrl??r.toString(),provider:t.provider??"SoundCloud",note:t.note});return{...i,title:t.title??i.title,playbackUrl:t.playbackUrl??i.playbackUrl}}if(t.audioUrl){const i=await ze(new URL(t.audioUrl,o),e,{title:t.title??X(r),sourceUrl:r.toString(),playbackUrl:t.playbackUrl??t.audioUrl,attributionUrl:t.attributionUrl??r.toString(),provider:t.provider??"SoundCloud",note:t.note});return{...i,title:t.title??i.title,playbackUrl:t.playbackUrl??t.audioUrl}}throw new Error("The SoundCloud resolver responded, but it did not provide an `audioUrl` or `waveformUrl`.")}}async function ze(r,e,n){const o=await fetch(r.toString(),{mode:"cors"});if(!o.ok)throw new Error(`Request failed with ${o.status} for ${r.hostname}.`);const t=o.headers.get("content-type")?.toLowerCase()??"",i=r.pathname.toLowerCase(),s={title:n.title??X(r),sourceUrl:n.sourceUrl??r.toString(),playbackUrl:n.playbackUrl,attributionUrl:n.attributionUrl??r.toString(),provider:n.provider,note:n.note};if(t.includes("mpegurl")||i.endsWith(".m3u8"))throw new Error("HLS playlist URLs are not decoded directly in this page. Use a waveform asset, a directly fetchable audio file, or a server resolver that returns one.");if(t.includes("json")||Mt.test(i)){const a=await o.json();return{title:s.title??X(r),sourceType:"waveform-json",samples:Wt(a),sourceUrl:s.sourceUrl,playbackUrl:s.playbackUrl,attributionUrl:s.attributionUrl,provider:s.provider,note:s.note??"Loaded from precomputed waveform data."}}if(t.startsWith("image/")||Et.test(i)){const a=await o.blob();return{title:s.title??X(r),sourceType:"waveform-image",samples:await Bt(a),sourceUrl:s.sourceUrl,playbackUrl:s.playbackUrl,attributionUrl:s.attributionUrl,provider:s.provider,note:s.note??"Loaded from a waveform image asset."}}if(t.startsWith("audio/")||t.startsWith("video/")||t.includes("octet-stream")||Ut.test(i)){const a=await o.arrayBuffer(),u=await tt(a,e);return{title:s.title??X(r),sourceType:"audio",samples:nt(u),sourceUrl:s.sourceUrl,playbackUrl:s.playbackUrl??r.toString(),attributionUrl:s.attributionUrl,provider:s.provider,note:s.note??"Loaded from decoded audio data."}}throw new Error(`Unsupported asset type "${t||"unknown"}". Use audio, waveform JSON, or waveform images.`)}async function Tt(r){const e=await fetch(r,{mode:"cors"});if(!e.ok)throw new Error(`Request failed with ${e.status}.`);return e.json()}function Ct(r){return(_t.test(r.hostname)||Lt.test(r.hostname))&&!r.pathname.startsWith("/oembed")}function X(r){const e=r.pathname.split("/").filter(Boolean).pop();return e?decodeURIComponent(e).replace(/\.[a-z0-9]+$/i,"").replace(/[-_]+/g," "):r.hostname}async function tt(r,e){try{return await e.decodeAudioData(r.slice(0))}catch{throw new Error("The source could not be decoded as audio. If this is a remote URL, check that it points to a real audio file and allows cross-origin requests.")}}function nt(r){const{length:e,numberOfChannels:n}=r,o=Array.from({length:n},(i,s)=>r.getChannelData(s)),t=Array.from({length:K},(i,s)=>{const a=Math.floor(s/K*e),u=Math.max(a+1,Math.floor((s+1)/K*e));let d=0,l=0,p=0;for(let T=a;T<u;T++){let b=0;for(const E of o)b+=E[T]??0;b/=n;const O=Math.abs(b);d=Math.max(d,O),l+=b*b,p++}const v=Math.sqrt(l/Math.max(1,p));return d*.65+v*.35});return re(t.map(i=>Math.pow(i,.82)))}function Wt(r){if(Array.isArray(r))return re(r.filter(pe));if(!jt(r))throw new Error("Waveform JSON must be an array or an object containing sample data.");if(Array.isArray(r.samples)){const e=r.samples.filter(pe),n=pe(r.height)?Math.max(1,r.height):Math.max(1,...e);return re(e.map(o=>o/n))}if(Array.isArray(r.data))return re(r.data.filter(pe));throw new Error("Waveform JSON did not include a supported sample array. Expected `samples` or `data`.")}async function Bt(r){const e=URL.createObjectURL(r);try{const n=await Ot(e),o=document.createElement("canvas");o.width=n.naturalWidth||n.width,o.height=n.naturalHeight||n.height;const t=o.getContext("2d");if(!t)throw new Error("Canvas 2D is unavailable in this browser.");t.drawImage(n,0,0);const{data:i,width:s,height:a}=t.getImageData(0,0,o.width,o.height),u=new Array(s).fill(0);for(let d=0;d<s;d++){let l=a,p=-1;for(let v=0;v<a;v++)i[(v*s+d)*4+3]>24&&(l=Math.min(l,v),p=Math.max(p,v));p>=l&&(u[d]=(p-l+1)/a)}return re(rt(u,K))}finally{URL.revokeObjectURL(e)}}function Ot(r){return new Promise((e,n)=>{const o=new Image;o.onload=()=>e(o),o.onerror=()=>n(new Error("The waveform image could not be decoded.")),o.src=r})}function re(r){if(!r.length)return new Array(K).fill(0);const e=r.map(o=>Math.max(0,o)),n=Math.max(...e);return!Number.isFinite(n)||n<=0?new Array(K).fill(0):rt(e.map(o=>o/n),K)}function rt(r,e){return r.length?r.length===e?[...r]:Array.from({length:e},(n,o)=>{const t=o/Math.max(1,e-1)*Math.max(0,r.length-1),i=Math.floor(t),s=Math.min(r.length-1,Math.ceil(t)),a=t-i;return r[i]*(1-a)+r[s]*a}):new Array(e).fill(0)}function pe(r){return typeof r=="number"&&Number.isFinite(r)}function jt(r){return typeof r=="object"&&r!==null}const oe=new Array(2048).fill(0),qe=16777215,Pt=2.4,kt=1.15;function Xe(r){const e=r;return{mode:e?.isWebGLRenderer===!0?"webgl":"webgpu",width:e&&e.backend?.isWebGPUBackend!==!0?kt:Pt}}function Nt(r,e){if(r==="webgpu")return new Te({color:qe,linewidth:e});const n=new We({color:qe}),o=n;return o.linewidth=e,n}function It(r,e){const n=r.attributes.instanceStart;if(!n){r.setPositions(e);return}const o=n.data.array,t=e.length/3;for(let i=0;i<t-1;i++){const s=i*3,a=i*6;o[a]=e[s],o[a+1]=e[s+1],o[a+2]=e[s+2],o[a+3]=e[s+3],o[a+4]=e[s+4],o[a+5]=e[s+5]}n.data.needsUpdate=!0}function ot(r,e){if(e<=1)return[...r];const n=new Array(r.length+1).fill(0);for(let o=0;o<r.length;o++)n[o+1]=n[o]+r[o];return r.map((o,t)=>{const i=Math.max(0,t-e),s=Math.min(r.length,t+e+1);return(n[s]-n[i])/Math.max(1,s-i)})}function De(r,e){const n=j.clamp(e,0,1)*Math.max(0,r.length-1),o=Math.floor(n),t=Math.min(r.length-1,Math.ceil(n)),i=n-o;return r[o]*(1-i)+r[t]*i}function Ft({staticWaveform:r,liveWaveformRef:e,playbackProgressRef:n,usePlaybackWindow:o,isRealtimeActive:t,lineRenderMode:i,lineWidth:s,rows:a=72,samples:u=180,width:d=36,depth:l=20,radius:p=.018}){const v=w.useMemo(()=>Nt(i,s),[i,s]),T=w.useMemo(()=>Array.from({length:a},()=>new Float32Array(u*3)),[a,u]),b=w.useMemo(()=>T.map(g=>{const m=new Be;return m.setPositions(g),m.attributes.instanceStart?.data.setUsage(ut),m}),[T]),O=w.useMemo(()=>b.map(g=>{const m=i==="webgpu"?new bt(g,v):new vt(g,v);return m.frustumCulled=!1,m}),[b,i,v]),E=w.useMemo(()=>{const g=r.length?r:oe,m=new Map,x=P=>{const S=Math.max(1,Math.round(P)),U=m.get(S);if(U)return U;const C=ot(g,S);return m.set(S,C),C};return Array.from({length:a},(P,S)=>{const U=S/(a-1),C=Math.pow(Math.sin(U*Math.PI),.9),B=j.lerp(-l/2,l/2,U),V=j.lerp(62,16,C),Z=Math.max(2,V*.22);return{depthOffset:B,rowEnvelope:C,broadSeries:x(V),detailSeries:x(Z),shift:(U-.5)*.08}})},[l,a,r]),G=()=>{const g=e.current?.length?e.current:oe,m=j.clamp(n.current??0,0,1);for(let x=0;x<a;x++){const P=b[x],S=E[x],U=T[x];for(let C=0;C<u;C++){const B=C/(u-1),V=j.lerp(-d/2,d/2,B),Z=Math.pow(Math.max(0,1-Math.abs(V)/(d*.48)),1.65),ve=j.clamp(B+S.shift*(1-S.rowEnvelope*.35),0,1),ee=j.lerp(.95,.58,S.rowEnvelope),ge=j.clamp(m+(B-.5)*ee+S.shift*.26,0,1),te=o?ge:ve,ne=De(S.broadSeries,te),Se=De(S.detailSeries,te),ie=Math.pow(ne,1.28),ae=Math.max(0,Se-ne*.8),se=.15+S.rowEnvelope*1.2,xe=De(g,j.clamp(B+S.shift*.34,0,1)),be=t?Math.pow(xe,1.42)*(.32+S.rowEnvelope*1.12):0,c=(ie*3.2+ae*6.8+be*4.4)*Z*se,f=C*3;U[f]=V,U[f+1]=c,U[f+2]=S.depthOffset}It(P,U)}};return ft(()=>{t&&G()}),w.useEffect(()=>{G()},[b,t,T,E,u,o,d]),w.useEffect(()=>()=>{for(const g of b)g.dispose()},[b]),w.useEffect(()=>()=>{v.dispose()},[v]),h.jsx("group",{rotation:[0,.82,0],children:O.map((g,m)=>h.jsx("primitive",{object:g},m))})}function $t(){const r=new URLSearchParams(window.location.search).get("source")??"",[e,n]=w.useState(r),[o,t]=w.useState([]),[i,s]=w.useState(null),[a,u]=w.useState("idle"),[d,l]=w.useState(!1),[p,v]=w.useState(!1),[T,b]=w.useState(()=>Xe()),[O,E]=w.useState("Load a local file, a direct audio URL, a waveform JSON/image URL, or a SoundCloud track URL via a resolver."),G=w.useRef(null),g=w.useRef(null),m=w.useRef(null),x=w.useRef(null),P=w.useRef(null),S=w.useRef(null),U=w.useRef(null),C=w.useRef([...oe]),B=w.useRef(0);w.useEffect(()=>()=>{ee(!0),m.current&&m.current.close(),U.current&&URL.revokeObjectURL(U.current)},[]),w.useEffect(()=>{ee(!0),v(!1),B.current=0,C.current=[...oe]},[i?.playbackUrl]),w.useEffect(()=>{r&&se(r)},[]);async function V(){if(m.current)return m.current;const c=window.AudioContext??window.webkitAudioContext;if(!c)throw new Error("Web Audio is unavailable in this browser.");return m.current=new c,m.current}async function Z(){const c=g.current;if(!c)throw new Error("Missing audio element for live analysis.");const f=await V();if(!P.current){const y=f.createAnalyser();y.fftSize=2048,y.smoothingTimeConstant=.78,P.current=y}if(!x.current){const y=f.createMediaElementSource(c);y.connect(P.current),P.current.connect(f.destination),x.current=y}return{analyser:P.current,audioContext:f,audioElement:c}}function ve(c){const f=Array.from(c,y=>y/255);return ot(f,8)}function ee(c=!1){S.current!==null&&(cancelAnimationFrame(S.current),S.current=null),l(!1),c&&(C.current=[...oe])}async function ge(){if(i?.sourceType==="audio")try{const{analyser:c,audioContext:f,audioElement:y}=await Z();if(await f.resume(),S.current!==null)return;const W=new Uint8Array(c.frequencyBinCount);v(!0),l(!0);const Oe=()=>{c.getByteFrequencyData(W),C.current=ve(W),B.current=y.duration?y.currentTime/y.duration:0,S.current=requestAnimationFrame(Oe)};Oe()}catch(c){const f=c instanceof Error?c.message:"Realtime analysis could not start.";u("error"),E(f)}}function te(){const c=g.current;c?.duration&&(B.current=c.currentTime/c.duration),ee(!0)}function ne(c){const f=c.note??`Loaded ${c.title}.`;return c.sourceType==="audio"&&c.playbackUrl?`${f} Press play below to drive the live analyser.`:f}function Se(){U.current&&(URL.revokeObjectURL(U.current),U.current=null)}function ie(c){Se(),c?.startsWith("blob:")&&(U.current=c)}function ae(c){const f=new URL(window.location.href);c?f.searchParams.set("source",c):f.searchParams.delete("source"),window.history.replaceState({},"",f)}async function se(c=e){u("loading"),E("Fetching and analyzing source data...");try{const f=await V(),y=await Dt(c,f);ie(y.playbackUrl),t(y.samples),s(y),u("ready"),E(ne(y)),n(c),ae(c)}catch(f){const y=f instanceof Error?f.message:"The source could not be analyzed.";u("error"),E(y)}}async function xe(c){const f=c.target.files?.[0];if(f){u("loading"),E(`Analyzing ${f.name}...`);try{const y=await V(),W=await At(f,y);ie(W.playbackUrl),t(W.samples),s(W),u("ready"),E(ne(W)),n(f.name),ae(null)}catch(y){const W=y instanceof Error?y.message:"The local file could not be analyzed.";u("error"),E(W)}finally{c.target.value=""}}}function be(c){c.preventDefault(),se()}return h.jsxs("main",{className:"JoyDivisionWavePage",children:[h.jsxs("header",{className:"JoyDivisionWaveHeader",children:[h.jsx("a",{className:"JoyDivisionWaveLink",href:"/",children:"Back to portfolio"}),h.jsx("h1",{children:"Joy Division Wave"}),h.jsx("p",{children:"Load a direct audio file, local upload, or precomputed waveform asset and the lines are rebuilt from that source."})]}),h.jsxs("section",{className:"JoyDivisionWaveControls",children:[h.jsxs("form",{className:"JoyDivisionWaveForm",onSubmit:be,children:[h.jsxs("label",{className:"JoyDivisionWaveField",children:[h.jsx("span",{children:"Audio or waveform source"}),h.jsx("input",{type:"text",inputMode:"url",autoCapitalize:"off",autoCorrect:"off",spellCheck:!1,value:e,onChange:c=>n(c.target.value),placeholder:"https://example.com/track.mp3 or https://soundcloud.com/..."})]}),h.jsxs("div",{className:"JoyDivisionWaveActions",children:[h.jsx("button",{type:"submit",disabled:a==="loading",children:a==="loading"?"Analyzing...":"Load URL"}),h.jsx("button",{type:"button",className:"JoyDivisionWaveSecondaryButton",onClick:()=>G.current?.click(),children:"Choose File"})]}),h.jsx("input",{ref:G,className:"JoyDivisionWaveHiddenInput",type:"file",accept:"audio/*,application/json,image/*,.json",onChange:xe})]}),h.jsxs("aside",{className:"JoyDivisionWaveStatusCard",children:[h.jsx("p",{className:"JoyDivisionWaveStatusEyebrow",children:"Status"}),h.jsx("p",{className:`JoyDivisionWaveStatusCopy JoyDivisionWaveStatusCopy${a}`,children:O}),h.jsx("p",{className:"JoyDivisionWaveHint",children:"Direct audio URLs need CORS. SoundCloud page URLs are wired for a resolver path, while SoundCloud-style waveform assets can load directly if they are fetchable."}),i&&h.jsxs("div",{className:"JoyDivisionWaveSourceMeta",children:[h.jsx("p",{className:"JoyDivisionWaveSourceTitle",children:i.title}),h.jsxs("p",{className:"JoyDivisionWaveHint",children:[i.provider?`${i.provider} · `:"",i.sourceType]}),i.attributionUrl&&h.jsx("a",{className:"JoyDivisionWaveMetaLink",href:i.attributionUrl,target:"_blank",rel:"noreferrer",children:"Open source link"}),i.playbackUrl&&h.jsx("audio",{ref:g,className:"JoyDivisionWaveAudio",controls:!0,preload:"metadata",crossOrigin:"anonymous",src:i.playbackUrl,onPlay:()=>{ge()},onPause:te,onEnded:te,onSeeked:()=>{const c=g.current;c?.duration&&(B.current=c.currentTime/c.duration)}})]})]})]}),h.jsx("section",{className:"JoyDivisionWaveCanvasShell",children:h.jsxs(dt,{frameloop:d?"always":"demand",camera:{position:[0,10,24],fov:30},onCreated:({camera:c,gl:f})=>{c.lookAt(0,1.5,0),b(y=>{const W=Xe(f);return y.mode===W.mode&&y.width===W.width?y:W})},gl:async c=>{const f=new pt({...c,antialias:!0});return await f.init(),f},children:[h.jsx("color",{attach:"background",args:["black"]}),h.jsx(Ft,{staticWaveform:o,liveWaveformRef:C,playbackProgressRef:B,usePlaybackWindow:i?.sourceType==="audio"&&p,isRealtimeActive:d,lineRenderMode:T.mode,lineWidth:T.width}),h.jsx(mt,{enablePan:!1})]})})]})}const it=document.getElementById("root");if(!it)throw new Error("Missing root element for Joy Division Wave page.");lt.createRoot(it).render(h.jsx($t,{}));
