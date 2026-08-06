// src/components/BirthdayPosterStudio/hooks/usePosterState.js
//
// Deliberately small. Every template is fixed data (see Templates/templates.js)
// so there is no "layer" state to track any more — just the handful of things
// the user is actually allowed to change:
//   1. which template is selected
//   2. which student is selected (drives name + default photo)
//   3. the name shown on the poster (editable, pre-filled from the student)
//   4. the photo itself + its pan/zoom position inside the frame
import { useState, useCallback, useMemo, useRef } from 'react';
import { TEMPLATES, getTemplate } from '../components/Templates/templates';
import { defaultPhotoTransform, toDataURL } from '../utils/image';

const getPersonPhoto = (person) =>
  person?.photo || person?.photoUrl || person?.profileImage || person?.profilePic || person?.avatar || '';

// Default name pre-fill only ever shows the first name (e.g. "Riya Sharma"
// -> "Riya"). The user can still edit it to add the surname back if they
// want to — this only changes what gets auto-filled on student selection.
const getFirstName = (fullName = '') => fullName.trim().split(/\s+/)[0] || '';

// Shown on every template unless/until real copy is wired up server-side —
// kept fixed (not user-editable) so templates never look broken or empty.
const DEFAULT_NOTE =
  'Wishing you a day filled with joy, laughter and wonderful memories. Have a fantastic year ahead!';

export function usePosterState({ initialTemplateId = TEMPLATES[0].id } = {}) {
  // ---- student ----------------------------------------------------------
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [name, setName] = useState('');

  // ---- template (fixed design, just pick which one) ----------------------
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const template = useMemo(() => getTemplate(templateId), [templateId]);

  // ---- photo: the only visual thing the user actually edits --------------
  const [photoSrc, setPhotoSrc] = useState(''); // what the on-screen preview shows (raw URL — instant)
  const [exportPhotoSrc, setExportPhotoSrc] = useState(''); // canvas-safe data URL used only by the hidden export node
  const [isCustomPhoto, setIsCustomPhoto] = useState(false); // true once user uploads their own
  const [photoTransform, setPhotoTransform] = useState(defaultPhotoTransform());
  const [photoReady, setPhotoReady] = useState(true); // preview is ready as soon as the source is known
  const photoRequestId = useRef(0); // guards against a stale conversion overwriting a newer selection
  const exportReadyRef = useRef(true); // true once exportPhotoSrc is a data URL (or empty)

  // Convert a remote URL to a base64 data URL in the background so the
  // hidden export node always has a canvas-safe image. Never blocks the
  // preview — the on-screen <img> keeps using the raw URL directly.
  const convertForExport = useCallback((src, requestId) => {
    if (!src || src.startsWith('data:')) {
      setExportPhotoSrc(src || '');
      exportReadyRef.current = true;
      return;
    }
    exportReadyRef.current = false;
    setExportPhotoSrc(src); // temporary; replaced once converted
    toDataURL(src)
      .then((dataUrl) => {
        if (photoRequestId.current !== requestId) return;
        setExportPhotoSrc(dataUrl);
        exportReadyRef.current = true;
      })
      .catch(() => {
        if (photoRequestId.current !== requestId) return;
        setExportPhotoSrc(src); // fall back to original remote URL
        exportReadyRef.current = true;
      });
  }, []);

  const setPhoto = useCallback((src, { custom = false } = {}) => {
    const requestId = ++photoRequestId.current;

    // Show the raw source immediately — preview is never blocked by the
    // (potentially slow) remote→data-URL conversion below.
    setPhotoSrc(src || '');
    setIsCustomPhoto(custom);
    setPhotoTransform(defaultPhotoTransform());
    setPhotoReady(true); // preview is ready right away

    convertForExport(src, requestId);
  }, [convertForExport]);

  // Ensure a canvas-safe data URL exists before we capture the export node.
  // Resolves to the data URL (triggering conversion if it hasn't finished).
  const prepareExportPhoto = useCallback(async (src) => {
    if (!src || src.startsWith('data:')) return src || '';
    if (exportReadyRef.current && exportPhotoSrc && exportPhotoSrc.startsWith('data:')) {
      return exportPhotoSrc;
    }
    try {
      const dataUrl = await toDataURL(src);
      setExportPhotoSrc(dataUrl);
      exportReadyRef.current = true;
      return dataUrl;
    } catch {
      return src;
    }
  }, [exportPhotoSrc]);

  const panPhoto = useCallback((pos) => {
    setPhotoTransform((prev) => ({ ...prev, x: pos.x, y: pos.y }));
  }, []);

  const setZoom = useCallback((scale) => {
    setPhotoTransform((prev) => ({ ...prev, scale }));
  }, []);

  const resetPhotoPosition = useCallback(() => {
    setPhotoTransform(defaultPhotoTransform());
  }, []);

  // ---- student selection: auto-fills name + profile photo ---------------
  const selectStudent = useCallback((id, birthdays = []) => {
    setSelectedPersonId(id);
    const person = birthdays.find((p) => String(p.id) === String(id));
    if (person) {
      // Default pre-fill uses only the first name — user can still edit
      // the name field afterwards to add the surname back if they want.
      setName(getFirstName(person.name));
      const photoUrl = getPersonPhoto(person);
      setPhoto(photoUrl, { custom: false });
      if (!photoUrl) {
        console.warn('Student selected but no photo available:', { id, person });
      } else {
        console.log('Student selected with photo:', { id, photo: photoUrl });
      }
    } else {
      console.warn('Student not found:', { id, birthdays });
    }
  }, [setPhoto]);

  // If the user picks a new template, keep their student/name/photo — only
  // the design changes, exactly as requested (template swap must never
  // disturb the content already filled in).
  const selectTemplate = useCallback((id) => {
    setTemplateId(id);
  }, []);

  // Restore the profile photo (undo a manual upload) for the current student.
  const useProfilePhoto = useCallback((birthdays = []) => {
    const person = birthdays.find((p) => String(p.id) === String(selectedPersonId));
    setPhoto(getPersonPhoto(person), { custom: false });
  }, [selectedPersonId, setPhoto]);

  return {
    // student
    selectedPersonId, name, setName, selectStudent,
    // template
    templateId, template, TEMPLATES, selectTemplate,
    // photo
    photoSrc, exportPhotoSrc, isCustomPhoto, setPhoto, panPhoto, setZoom, photoTransform,
    resetPhotoPosition, useProfilePhoto, photoReady, prepareExportPhoto,
    // fixed copy
    note: DEFAULT_NOTE,
  };
} 