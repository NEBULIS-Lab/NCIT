# Third-party assets

This directory combines the Franka Emika Panda model from MuJoCo Menagerie with
three converted tool meshes from RoboTwin and an Assembly1-only RoboDojo wrench.

## RoboDojo wrench

`tools/robodojo-wrench.obj` comes from RoboDojo
`Assets/Object/RoboDojo/Rigid/wrench/00001/object.usdz`, UUID
`308fd1d1-7f33-43c4-ad67-3ac5ac56ddcd` (metal open-end wrench).
The original 1,399 vertices and 876 triangles are preserved. USD transforms are
baked in meters, centered, and rotated 180 degrees around vertical; no visual
remodeling or resizing is performed. Its original collision mesh is converted
to 18 convex pieces for MuJoCo, following the source's convex-decomposition
collision setting. The 0.15 kg mass is from the source metadata.
Voxel preprocessing is disabled to prevent inflation of the thin tool surface.

Source identity, checksum, bounds and generated XML are recorded in
`tools/robodojo-wrench.json`; conversion is reproducible with
`scripts/convert-robodojo-wrench.py` using usd-core, numpy, trimesh and coacd.
The uniform source gray is retained, with a metallic render finish matching the
workcell. RoboDojo's accompanying MIT license is in `ROBODOJO_LICENSE`.

- `scene.xml`, `panda.xml`, and `assets/`: copied from
  `google-deepmind/mujoco_menagerie/franka_emika_panda`. See the upstream
  notices copied with those files.
- `tools/robotwin-screwdriver.obj`: converted from
  `RoboTwin/assets/objects/032_screwdriver/visual/base0.glb`.
- `tools/robotwin-drill.obj`: converted from
  `RoboTwin/assets/objects/030_drill/visual/base6.glb`.
- `tools/robotwin-hammer.obj`: converted from
  `RoboTwin/assets/objects/020_hammer/visual/base0.glb`.

The matching PNG files are the base-color textures embedded in those same GLB
files. `scripts/convert-robotwin-tools.py` applies GLB node transforms, rotates
the authored +Y tool axis onto local +X, centers each mesh, exports the complete
OBJ geometry and source texture, then classifies its textured triangles into
`primary`, `dark`, and `metal` OBJ partitions. These partitions preserve visible
color blocking in the current web renderer, which does not consume mesh UVs.
The drill and hammer are enlarged slightly from RoboTwin's task scale to match a
realistic Panda workcell tool envelope; MuJoCo collision uses documented simple
primitive proxies rather than these high-detail visual meshes.

RoboTwin is licensed under the MIT License, Copyright (c) 2025 Tianxing Chen.
The complete license text is included as `ROBOWTWIN_LICENSE` in this directory.
