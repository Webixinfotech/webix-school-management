// src/components/BirthdayPosterStudio/assets.js
//
// Single source of truth for every image asset the studio uses.
// Paths are relative to THIS file's location:
//   src/components/BirthdayPosterStudio/assets.js
//   -> ../../assets/...  ==  src/assets/...
// which matches V:\VRS\Brain-Builder\src\assets\... exactly.
// If you place this folder somewhere else, only these seven lines need updating.

import logo from '../../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';
import blackboxgift from '../../assets/optimized/general/brain-builder-asset-blackboxgift.webp';
import blueBalloon from '../../assets/optimized/general/brain-builder-asset-blueballoon.webp';
import cake from '../../assets/optimized/general/brain-builder-asset-cake.webp';
import multiBalloons from '../../assets/optimized/general/brain-builder-asset-multiballoons.webp';
import orangeBalloon from '../../assets/optimized/general/brain-builder-asset-orangeballoon.webp';
import redBalloon from '../../assets/optimized/general/brain-builder-asset-redballoon.webp';
import starBalloon from '../../assets/optimized/general/brain-builder-asset-starballoon.webp';

// Every decoration is registered here with a stable key. Templates and the
// "Decorations" sidebar tab both reference decorations by this key, so
// adding a new PNG later is a two-line change (import + entry below).
export const DECORATIONS = {
  blackboxgift: { src: blackboxgift, label: 'Gift Box', defaultSize: 130 },
  blueBalloon: { src: blueBalloon, label: 'Blue Balloon', defaultSize: 110 },
  cake: { src: cake, label: 'Birthday Cake', defaultSize: 150 },
  multiBalloons: { src: multiBalloons, label: 'Balloon Bunch', defaultSize: 190 },
  orangeBalloon: { src: orangeBalloon, label: 'Orange Balloon', defaultSize: 110 },
  redBalloon: { src: redBalloon, label: 'Red Balloon', defaultSize: 110 },
  starBalloon: { src: starBalloon, label: 'Star Balloon', defaultSize: 120 },
};

export const LOGO_SRC = logo;

export const DECORATION_KEYS = Object.keys(DECORATIONS);
