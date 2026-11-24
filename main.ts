// MUSE VM-X: tiny stack VM interpreter for make.fun's tiny-stack-vm-01 bounty.
// Written in this session from ISA.md, with vm.mjs as the oracle: 32-bit wrap, traps 2-11.
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
const E=new TextEncoder();
function run(p,g){
  const n=p.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536);
  let sp=0,cp=0,ol=0,ip=0,pc=0,st=0;
  const end=x=>[o.subarray(0,ol),x];
  for(;;){
    if(st===1000000)return end(10);
    if(pc<0||pc>=n)return end(9);
    const op=p[pc];
    let im=0;
    if(op===1)im=1;else if(op===2)im=4;else if(op>=48&&op<=51)im=2;
    else if(!(op===0||(op>=3&&op<=7)||(op>=16&&op<=30)||(op>=32&&op<=34)||op===52||op===64||op===65||(op>=80&&op<=83)))return end(5);
    if(pc+im>=n)return end(9);
    st++;
    const nx=pc+1+im;
    pc=nx;
    switch(op){
      case 0:return end(0);
      case 1:
        if(sp>=256)return end(3);
        D[sp++]=(p[nx-1]<<24)>>24;
        break;
      case 2:
        if(sp>=256)return end(3);
        D[sp++]=p[nx-4]|(p[nx-3]<<8)|(p[nx-2]<<16)|(p[nx-1]<<24);
        break;
      case 3:
        if(sp<1)return end(2);
        sp--;
        break;
      case 4:
        if(sp<1)return end(2);
        if(sp>=256)return end(3);
        D[sp]=D[sp-1];sp++;
        break;
      case 5:
        if(sp<2)return end(2);
        {const t=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=t;}
        break;
      case 6:
        if(sp<2)return end(2);
        if(sp>=256)return end(3);
        D[sp]=D[sp-2];sp++;
        break;
      case 7:
        if(sp<3)return end(2);
        {const a=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=a;}
        break;
      case 23:
        if(sp<1)return end(2);
        D[sp-1]=-D[sp-1]|0;
        break;
      case 27:
        if(sp<1)return end(2);
        D[sp-1]=~D[sp-1];
        break;
      case 16:case 17:case 18:case 19:case 20:case 21:case 22:case 24:case 25:case 26:case 28:case 29:case 30:case 32:case 33:case 34:{
        if(sp<2)return end(2);
        const b=D[sp-1],a=D[sp-2];
        let r;
        switch(op){
          case 16:r=(a+b)|0;break;
          case 17:r=(a-b)|0;break;
          case 18:r=Math.imul(a,b);break;
          case 19:
            if(b===0)return end(4);
            r=a===-2147483648&&b===-1?a:(a/b)|0;
            break;
          case 20:
            if(b===0)return end(4);
            r=b===-1?0:a%b|0;
            break;
          case 21:
            if(b===0)return end(4);
            r=Math.floor((a>>>0)/(b>>>0))|0;
            break;
          case 22:
            if(b===0)return end(4);
            r=(a>>>0)%(b>>>0)|0;
            break;
          case 24:r=a&b;break;
          case 25:r=a|b;break;
          case 26:r=a^b;break;
          case 28:r=a<<(b&31);break;
          case 29:r=a>>(b&31);break;
          case 30:r=(a>>>(b&31))|0;break;
          case 32:r=a===b?1:0;break;
          case 33:r=a<b?1:0;break;
          case 34:r=(a>>>0)<(b>>>0)?1:0;break;
        }
        sp-=2;D[sp++]=r;
        break;
      }
      case 48:case 49:case 50:{
        const rel=((p[nx-2]|(p[nx-1]<<8))<<16)>>16;
        let t=true;
        if(op!==48){
          if(sp<1)return end(2);
          const v=D[--sp];
          t=op===49?v===0:v!==0;
        }
        if(t)pc=nx+rel;
        break;
      }
      case 51:
        if(cp===64)return end(7);
        C[cp++]=nx;
        pc=p[nx-2]|(p[nx-1]<<8);
        break;
      case 52:
        if(cp===0)return end(8);
        pc=C[--cp];
        break;
      case 64:{
        if(sp<1)return end(2);
        const a=D[sp-1];
        if(a<0||a>=256)return end(6);
        D[sp-1]=M[a];
        break;
      }
      case 65:{
        if(sp<2)return end(2);
        const a=D[sp-1],v=D[sp-2];
        if(a<0||a>=256)return end(6);
        sp-=2;M[a]=v;
        break;
      }
      case 80:{
        if(sp<1)return end(2);
        const e=E.encode(String(D[sp-1]));
        if(ol+e.length>65536)return end(11);
        sp--;o.set(e,ol);ol+=e.length;
        break;
      }
      case 81:
        if(sp<1)return end(2);
        if(ol+1>65536)return end(11);
        o[ol++]=D[--sp]&255;
        break;
      case 82:
        if(sp>=256)return end(3);
        D[sp++]=ip<g.length?g[ip++]:-1;
        break;
      case 83:
        if(sp<1)return end(2);
        return end(D[--sp]&255);
      default:return end(5);
    }
  }
}
for(const id of readdirSync(I).sort()){
  mkdirSync(join(O,id),{recursive:true});
  const [o,x]=run(readFileSync(join(I,id,'program.bin')),readFileSync(join(I,id,'input.bin')));
  writeFileSync(join(O,id,'stdout.bin'),o);
  writeFileSync(join(O,id,'exit.txt'),x+'\n');
}
