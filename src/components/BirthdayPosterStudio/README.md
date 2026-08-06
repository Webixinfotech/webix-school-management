# Birthday Poster Studio — Integration Guide (v2, simplified)

## 1. Where this goes
Same as before — this folder replaces itself in place at:
```
V:\VRS\Brain-Builder\src\components\BirthdayPosterStudio\
```
`assets.js` still imports from `../../assets/...` (two levels up from this
folder), matching:
```
V:\VRS\Brain-Builder\src\assets\birthday\blackboxgift.png
V:\VRS\Brain-Builder\src\assets\birthday\blueBalloon.png
V:\VRS\Brain-Builder\src\assets\birthday\cake.png
V:\VRS\Brain-Builder\src\assets\birthday\multiBalloons.png
V:\VRS\Brain-Builder\src\assets\birthday\orangeBalloon.png
V:\VRS\Brain-Builder\src\assets\birthday\redBalloon.png
V:\VRS\Brain-Builder\src\assets\birthday\starBalloon.png
V:\VRS\Brain-Builder\src\assets\logo.png
```
Nothing to change unless your asset folder moves.

## 2. What changed vs. the old (Canva-style) version
This is a rebuild of the whole studio around one rule: **posters are fixed
templates, not a design tool.** The only things a user can ever change are:

1. **Which template** — pick from a gallery of ready-made, pre-designed posters
2. **Which student** — auto-fills the name and pulls their profile photo
3. **The name** shown on the poster (editable, in case it needs a tweak)
4. **The photo** — replace it, and reposition/zoom it inside the frame

Everything else — text position/size/color, decorations, logo placement,
background, effects — is fixed by the template design and cannot be
dragged, deleted, resized, recolored, or otherwise broken by a user.
There is no properties panel, no layers panel, no "add text/shape" tools,
no crop tool, no multi-photo collage editor, no share buttons. Just:
student → name → template → photo → **Download**.

**Kept exactly as before:**
- The `birthdays` / `onToast` prop contract (nothing about how you fetch
  birthdays changes)
- Student selection → auto-fills name + profile photo
- Photo upload (single photo; drag to pan, slider to zoom)
- Download to PNG, pixel-identical to the on-screen preview (via the same
  hidden full-resolution portal-clone technique as before, so the download
  can never be squished/cropped/offset relative to what's shown)

**Removed:**
- The entire Canva-style sidebar (11 tool tabs → replaced by 4 simple,
  collapsible sections: Student, Name, Template, Photo)
- The right-hand Properties panel (nothing is selectable/editable anymore
  besides the photo)
- Drag/resize/recolor for text, decorations, and logo
- Multi-photo collage tool, background picker, frame-shape picker, effects
  toggles, layer reordering, "add text" / "add decoration" tools
- Multiple export sizes/format picker → one Download button, sensible
  fixed quality (2048px PNG)

## 3. Dependencies
Unchanged — `html2canvas` and `lucide-react`, same as before. No new
packages to install.

## 4. File map
```
BirthdayPosterStudio/
  index.jsx                          ← main export, same props as before
  assets.js                          ← all local PNG imports, one place
  hooks/usePosterState.js            ← small state: student, name, template, photo
  utils/{download,image,shapes}.js
  components/
    Canvas/
      PosterCanvas.jsx               ← draws one fixed template + the photo
      ScaledCanvas.jsx               ← responsive on-screen scaled wrapper
      PhotoFrame.jsx                 ← the ONE interactive layer (pan + zoom)
      TextLayerView.jsx              ← static text (name / fixed note)
      DecorationSprite.jsx           ← static decorations + logo
      EffectsOverlay.jsx             ← template-driven background effects
      useDrag.js                     ← shared pointer-drag hook (used by photo only)
    Templates/templates.js           ← the fixed template designs (unchanged data)
    Panel/
      ControlPanel.jsx               ← the whole simplified control surface
      Section.jsx                    ← small collapsible section wrapper
      StudentPicker.jsx              ← searchable student list
      TemplateGallery.jsx            ← live-preview template grid
      TemplateThumb.jsx              ← tiny true-to-design template preview
      PhotoControls.jsx              ← upload / use-profile-photo / zoom slider
```

Every file was syntax-checked and bundle-resolved with esbuild before
delivery (all imports/exports verified to match).

## 5. Wiring it in
No change needed if you already had the previous version wired in:
```jsx
import BirthdayPosterStudio from './components/BirthdayPosterStudio';
// ...
<BirthdayPosterStudio birthdays={birthdays} onToast={showToast} />
```
