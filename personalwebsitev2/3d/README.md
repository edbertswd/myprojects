# 3D source assets

`me.glb` is the original Tripo3D scan (17.7 MB, ~600k triangles). It is **not** served directly.
The web-ready copy lives at `public/models/me.glb` (~0.8 MB) and is produced with:

```bash
npx @gltf-transform/cli optimize 3d/me.glb public/models/me.glb \
  --compress meshopt --simplify true --simplify-ratio 0.2 --simplify-error 0.001 \
  --texture-compress webp --texture-size 1024 --weld true --prune true
```

Re-run this after replacing the scan.
