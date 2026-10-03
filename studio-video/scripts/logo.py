import numpy as np, cv2
from PIL import Image
im=np.array(Image.open('brand/planche_logo.jpg').convert('RGB')).astype(np.float32)
bg=np.array([254,254,254],np.float32)
def vec(box,k,name,scale=5):
    x0,y0,x1,y1=box; c=im[y0:y1,x0:x1]; H,W=c.shape[:2]
    v=c-bg; d=np.linalg.norm(v,axis=2)
    core=c[d>90].reshape(-1,3)
    crit=(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,50,0.5)
    _,_,cent=cv2.kmeans(core,k,None,crit,8,cv2.KMEANS_PP_CENTERS)
    cv_=cent-bg; cn=cv_/np.linalg.norm(cv_,axis=1,keepdims=True)
    vn=v/np.maximum(d[...,None],1e-3)
    cos=np.einsum('hwc,kc->hwk',vn,cn)
    # alpha estimate: projection length / cluster length
    lab=np.argmax(cos,-1)
    proj=np.einsum('hwc,hwc->hw',v,cn[lab])/np.linalg.norm(cv_,axis=1)[lab]
    alpha=np.clip(proj,0,1)
    S=(W*scale,H*scale)
    A=cv2.resize(alpha,S,interpolation=cv2.INTER_CUBIC)
    A=cv2.GaussianBlur(A,(0,0),scale*0.7)
    A=np.clip((A-0.42)/0.16,0,1); A=A*A*(3-2*A)
    # smooth label: one-hot weighted by alpha, upscale+blur, argmax
    oh=np.stack([(lab==i)*alpha for i in range(k)],-1).astype(np.float32)
    ohu=np.stack([cv2.GaussianBlur(cv2.resize(oh[...,i],S,interpolation=cv2.INTER_CUBIC),(0,0),scale*0.9) for i in range(k)],-1)
    L=np.argmax(ohu,-1)
    rgb=cent[L]
    out=np.dstack([rgb,A*255]).clip(0,255).astype(np.uint8)
    Image.fromarray(out,'RGBA').save(f'app/assets/{name}.png')
    print(name,['#%02x%02x%02x'%tuple(int(x) for x in cc) for cc in cent])
vec((480,40,700,256),4,'logo_symbol')
vec((325,255,842,346),2,'wordmark')
