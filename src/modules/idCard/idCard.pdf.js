
//========= Beackend logic proper ========================//

/**
 * ID Card PDF Generator
 *
 * Layouts (matching hand-drawn design):
 *
 * STUDENT (Landscape):
 *   ┌─────────────────────────────────────┐
 *   │      School Name / Tagline          │  ← Header
 *   ├───────────────┬───────────────────┤
 *   │ [Student Photo]│   [ QR Code ]      │
 *   ├───────────────┴───────────────────┤
 *   │  Name / ID      │  Transport        │
 *   ├───────────────────────────────────┤
 *   │             Footer                  │
 *   └─────────────────────────────────────┘
 *
 * STAFF (Portrait):
 *   ┌───────────────────────┐
 *   │  Logo  School Name     │
 *   │        Tagline         │  ← Header
 *   ├──────────┬────────────┤
 *   │  [Photo] │  Name       │
 *   │          │  ID         │
 *   │          │  Role       │
 *   ├──────────┴────────────┤
 *   │       [ QR Code ]      │
 *   ├───────────────────────┤
 *   │        Footer          │
 *   └───────────────────────┘
 */

const PDFDocument = require("pdfkit");
const https = require("https");
const http = require("http");
const { generateQRCodeDataURL } = require("./idCard.qr");
const logger = require("../../config/logger");

const MM_TO_PT = 2.8346;
const CARD = { W: Math.round(90.0 * MM_TO_PT), H: Math.round(59 * MM_TO_PT) };
const PORTRAIT = { W: CARD.H, H: CARD.W };

// ─── Shared utils ─────────────────────────────────────────────────────────────

function fetchImageBuffer(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (url.startsWith("data:")) {
      try {
        resolve(Buffer.from(url.split(",")[1], "base64"));
      } catch {
        resolve(null);
      }
      return;
    }
    const client = url.startsWith("https://") ? https : http;
    const req = client.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode !== 200) return resolve(null);
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

function trunc(str, max = 25) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function hexToRGB(hex) {
  const h = (hex || "#000000").replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function setFill(doc, hex) {
  const { r, g, b } = hexToRGB(hex);
  doc.fillColor([r, g, b]);
}
function setStroke(doc, hex) {
  const { r, g, b } = hexToRGB(hex);
  doc.strokeColor([r, g, b]);
}

/**
 * Draw an image to completely cover a square/rect box (like CSS object-fit: cover),
 * clipping any overflow rather than letterboxing. PDFKit's `fit` preserves aspect
 * ratio but leaves empty space when the image's ratio doesn't match the box;
 * this clips a centered crop so the box is always fully covered, no stretching.
 */
function drawImageCover(doc, imgBuf, x, y, w, h) {
  doc.save();
  try {
    doc.rect(x, y, w, h).clip();
    const img = doc.openImage(imgBuf);
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let drawW, drawH, drawX, drawY;
    if (imgRatio > boxRatio) {
      // image wider than box -> match height, crop left/right sides
      drawH = h;
      drawW = h * imgRatio;
      drawX = x - (drawW - w) / 2;
      drawY = y;
    } else {
      // image taller than box -> match width, crop top/bottom
      drawW = w;
      drawH = w / imgRatio;
      drawX = x;
      drawY = y - (drawH - h) / 2;
    }
    doc.image(img, drawX, drawY, { width: drawW, height: drawH });
  } finally {
    // CRITICAL: always restore the graphics state, even if doc.image() throws.
    // Without this, an error here leaves the clip region active for every
    // subsequent draw call on the page — causing later text() calls to be
    // squeezed into that narrow clipped box and wrap one character per line
    // (the "vertical text" bug seen on A4 sheets).
    doc.restore();
  }
}

async function drawQR(doc, qrData, qx, qy, qSize, primaryColor) {
  try {
    const qrDataUrl = await generateQRCodeDataURL(qrData, { size: qSize * 3 });
    if (!qrDataUrl) return;
    const qrBuf = Buffer.from(qrDataUrl.split(",")[1], "base64");
    setStroke(doc, primaryColor);
    doc.lineWidth(0.5).rect(qx, qy, qSize, qSize).stroke();
    doc.image(qrBuf, qx + 1, qy + 1, { width: qSize - 2, height: qSize - 2 });
  } catch (err) {
    logger.warn("[IdCard] QR draw failed:", err.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENT FRONT — Landscape
// ════════════════════════════════════════════════════════════════════════════

async function drawStudentFront(doc, student, template, x, y, W, H) {
  const brand = template.branding || {};
  const hdr = template.header || {};
  const body = template.body || {};
  const ftr = template.footer || {};
  const primaryColor = brand.primaryColor || "#1a237e";
  const accentColor = brand.accentColor || "#ffd600";

  setFill(doc, "#ffffff");
  doc.rect(x, y, W, H).fill();

  // ── HEADER: Logo top-center (if any) + School Name + Tagline below ────────
  const hasLogo = hdr.showLogo && !!brand.schoolLogo;
  const hdrH = Math.round(H * (hasLogo ? 0.26 : 0.2));
  setFill(doc, hdr.backgroundColor || primaryColor);
  doc.rect(x, y, W, hdrH).fill();

  let textY = y + 5;
  if (hasLogo) {
    const logoBuf = await fetchImageBuffer(brand.schoolLogo);
    if (logoBuf) {
      try {
        const lSize = Math.round(hdrH * 0.4);
        const lx = x + (W - lSize) / 2;
        doc.image(logoBuf, lx, y + 3, {
          width: lSize,
          height: lSize,
          fit: [lSize, lSize],
        });
        textY = y + 3 + lSize + 2;
      } catch {
        /* skip */
      }
    }
  }
  if (hdr.showSchoolName && brand.schoolName) {
    setFill(doc, hdr.textColor || "#ffffff");
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(trunc(brand.schoolName, 38), x + 6, textY, {
        width: W - 12,
        align: "center",
      });
    if (hdr.showTagline && brand.tagline) {
      doc
        .fontSize(5)
        .font("Helvetica")
        .text(trunc(brand.tagline, 45), x + 6, textY + 10, {
          width: W - 12,
          align: "center",
        });
    }
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const ftrH = 14;
  const ftrY = y + H - ftrH;
  setFill(doc, ftr.backgroundColor || primaryColor);
  doc.rect(x, ftrY, W, ftrH).fill();
  setFill(doc, accentColor);
  doc.rect(x, y + H - 2, W, 2).fill();

  if (ftr.showValidity && template.validityDate) {
    setFill(doc, ftr.textColor || "#ffffff");
    doc
      .fontSize(5)
      .font("Helvetica")
      .text("Valid Until: " + fmtDate(template.validityDate), x + 5, ftrY + 4, {
        width: W / 2 - 4,
      });
  }

  if (ftr.customText) {
    setFill(doc, ftr.textColor || "#cb4f4f");

    const footerText = ftr.customText;

    const textWidth = doc.widthOfString(footerText, { fontSize: 5 });

    const rightPadding = 6;

    let startX = W - textWidth - rightPadding;

    if (startX < W * 0.4) {
      startX = W * 0.4;
    }

    doc
      .fontSize(5)
      .font("Helvetica")
      .text(footerText, x + startX, ftrY + 4, {
        width: textWidth + 2,
        align: "left",
      });
  }

  // ── BODY: Photo (left) + QR (right) side by side ───────────────────────────
  const bodyY = y + hdrH + 4;
  const rowH = Math.round(H * 0.42); // photo/QR row height
  const colGap = 6;
  const colW = (W - colGap - 12) / 2; // two equal columns
  const photoX = x + 6;
  const qrX = photoX + colW + colGap;
  const boxSize = Math.min(rowH, colW) - 2;

  // Photo box (left column, centered within column) — fully covers the box
  if (body.showPhoto) {
    const px = photoX + (colW - boxSize) / 2;
    setStroke(doc, primaryColor);
    doc.lineWidth(1).rect(px, bodyY, boxSize, boxSize).stroke();
    let photoBuf = student.photo ? await fetchImageBuffer(student.photo) : null;
    if (photoBuf) {
      try {
        drawImageCover(
          doc,
          photoBuf,
          px + 1,
          bodyY + 1,
          boxSize - 2,
          boxSize - 2,
        );
      } catch {
        photoBuf = null;
      }
    }
    if (!photoBuf) {
      setFill(doc, "#e3f2fd");
      doc.rect(px + 1, bodyY + 1, boxSize - 2, boxSize - 2).fill();
      setFill(doc, primaryColor);
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
          (student.firstName?.[0] || "") + (student.lastName?.[0] || ""),
          px + 1,
          bodyY + boxSize / 2 - 8,
          { width: boxSize - 2, align: "center" },
        );
    }
  }

  // QR box (right column, centered within column)
  if (body.showQrOnFront) {
    const qx = qrX + (colW - boxSize) / 2;
    const qrData =
      student.qrCode ||
      `${process.env.APP_BASE_URL || "https://app.brainbuilder.com"}/verify/student/${student._id}`;
    await drawQR(doc, qrData, qx, bodyY, boxSize, primaryColor);
  }

  // ── ROW 2: Name/Class (left, centered under photo) + Admission No./extra (right, centered under QR) ───
  const row2Y = bodyY + rowH + 8;
  const availH = ftrY - row2Y - 4;

  // Left column rows
  const leftRows = [];
  if (body.showName)
    leftRows.push({
      type: "name",
      value: `${student.firstName || ""} ${student.lastName || ""}`,
    });

  if (body.showClass)
    leftRows.push({
      type: "field",
      label: "Class",
      value: `${student.className || ""}${student.section ? " - " + student.section : ""}`,
    });
  const validLeft = leftRows.filter((r) => r.value);
  const leftGap =
    validLeft.length > 1
      ? Math.min(13, Math.max(9, Math.round(availH / validLeft.length)))
      : 9;

  let ly = row2Y;
  validLeft.forEach((row) => {
    if (row.type === "name") {
      setFill(doc, primaryColor);
      const nameX = photoX + (colW - boxSize) / 2;

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .text(trunc(row.value, 22), nameX, ly, {
          width: boxSize,
          align: "center",
        });

      ly += leftGap + 1;
    } else {
      setFill(doc, "#757575");
      doc
        .fontSize(4.2)
        .font("Helvetica")
        .text(row.label, photoX, ly, { width: colW });
      setFill(doc, "#212121");
      doc
        .fontSize(5.5)
        .font("Helvetica-Bold")
        .text(String(row.value), photoX, ly + 4, { width: colW });
      ly += leftGap;
    }
  });

  // Right column rows
  const rightRows = [];
  if (body.showTransportRoute && template.transportRoute)
    rightRows.push({ label: "Transport", value: template.transportRoute });
  if (body.showRollNo)
    rightRows.push({ label: "Roll No.", value: student.rollNo });
  if (body.showDob)
    rightRows.push({ label: "DOB", value: fmtDate(student.dateOfBirth) });
  if (body.showBloodGroup && student.bloodGroup)
    rightRows.push({ label: "Blood Group", value: student.bloodGroup });
  if (body.showParentName && student.parentDetails?.primaryName)
    rightRows.push({
      label: "Parent",
      value: trunc(student.parentDetails.primaryName, 18),
    });
  if (body.showContact && student.parentDetails?.primaryPhone)
    rightRows.push({
      label: "Contact",
      value: student.parentDetails.primaryPhone,
    });
  if (body.showSession && template.session)
    rightRows.push({ label: "Session", value: template.session });

  if (body.showId && student.admissionNo)
    rightRows.unshift({
      label: "Admission No.",
      value: student.admissionNo,
    });

  const validRight = rightRows.filter((r) => r.value);
  const rightGap =
    validRight.length > 1
      ? Math.min(13, Math.max(9, Math.round(availH / validRight.length)))
      : 9;

  let ry = row2Y;

  const qrCenterX = qrX + (colW - boxSize) / 2;

  validRight.forEach((row) => {
    setFill(doc, "#757575");

    doc.fontSize(4.2).font("Helvetica").text(row.label, qrCenterX, ry, {
      width: boxSize,
      align: "center",
    });

    setFill(doc, "#212121");

    doc
      .fontSize(5.5)
      .font("Helvetica-Bold")
      .text(trunc(String(row.value), 20), qrCenterX, ry + 4, {
        width: boxSize,
        align: "center",
      });

    ry += rightGap;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// STAFF FRONT — Portrait
// ════════════════════════════════════════════════════════════════════════════

async function drawStaffFront(doc, teacher, template, x, y, W, H) {
  const brand = template.branding || {};
  const hdr = template.header || {};
  const body = template.body || {};
  const ftr = template.footer || {};
  const primaryColor = brand.primaryColor || "#004d40";
  const accentColor = brand.accentColor || "#00796b";

  setFill(doc, "#ffffff");
  doc.rect(x, y, W, H).fill();

  // ── HEADER: Logo top-center, School Name + Tagline stacked below ───────────
  const hasLogo = hdr.showLogo && !!brand.schoolLogo;
  const hdrH = Math.round(H * (hasLogo ? 0.22 : 0.16));
  setFill(doc, hdr.backgroundColor || primaryColor);
  doc.rect(x, y, W, hdrH).fill();

  let textY = y + 4;
  if (hasLogo) {
    const logoBuf = await fetchImageBuffer(brand.schoolLogo);
    if (logoBuf) {
      try {
        const lSize = Math.round(hdrH * 0.42);
        const lx = x + (W - lSize) / 2;
        doc.image(logoBuf, lx, y + 3, {
          width: lSize,
          height: lSize,
          fit: [lSize, lSize],
        });
        textY = y + 3 + lSize + 2;
      } catch {
        /* skip */
      }
    }
  }
  if (hdr.showSchoolName && brand.schoolName) {
    setFill(doc, hdr.textColor || "#ffffff");
    doc
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .text(trunc(brand.schoolName, 32), x + 4, textY, {
        width: W - 8,
        align: "center",
      });
    if (hdr.showTagline && brand.tagline) {
      doc
        .fontSize(4.2)
        .font("Helvetica")
        .text(trunc(brand.tagline, 38), x + 4, textY + 9, {
          width: W - 8,
          align: "center",
        });
    }
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const ftrH = 14;
  const ftrY = y + H - ftrH;
  setFill(doc, ftr.backgroundColor || primaryColor);
  doc.rect(x, ftrY, W, ftrH).fill();
  setFill(doc, accentColor);
  doc.rect(x, y + H - 2, W, 2).fill();

  if (ftr.showValidity && template.validityDate) {
    setFill(doc, ftr.textColor || "#ffffff");
    doc
      .fontSize(5)
      .font("Helvetica")
      .text("Valid Until: " + fmtDate(template.validityDate), x + 5, ftrY + 4, {
        width: W / 2 - 4,
      });
  }
  if (ftr.customText) {
    setFill(doc, ftr.textColor || "#ffffff");
    doc
      .fontSize(5)
      .font("Helvetica")
      .text(trunc(ftr.customText, 30), x + W / 2, ftrY + 4, {
        width: W / 2 - 5,
        align: "right",
      });
  }

  // ── QR section (above footer, full width centered) ─────────────────────────
  const qrSectionH = body.showQrOnFront ? Math.round(H * 0.3) : 0;
  const qrZoneY = ftrY - qrSectionH;

  if (body.showQrOnFront && qrSectionH > 14) {
    setStroke(doc, "#e0e0e0");
    doc
      .lineWidth(0.5)
      .moveTo(x + 4, qrZoneY)
      .lineTo(x + W - 4, qrZoneY)
      .stroke();

    const qrSize = Math.min(qrSectionH - 4, W * 0.6);

    const qx = x + (W - qrSize) / 2;
    const qrData =
      teacher.qrCode ||
      `${process.env.APP_BASE_URL || "https://app.brainbuilder.com"}/verify/staff/${teacher._id}`;
    await drawQR(doc, qrData, qx, qrZoneY + 3, qrSize, primaryColor);
  }

  // ── BODY: Photo (left) + Name/ID/Role (right) ──────────────────────────────
  const bodyY = y + hdrH + 6;
  const bodyH = qrZoneY - bodyY - 4;
  // const photoSize = Math.min(Math.round(bodyH * 0.85), Math.round(W * 0.4));
  const photoSize = Math.min(Math.round(bodyH * 0.82), Math.round(W * 0.38));
  const photoX = x + 8;
  const infoX = photoX + photoSize + 8;
  // const infoW = Math.max(30, W - infoX - x - 6);
  // const infoW = Math.max(55, W - infoX - 8);
  const infoW = W - (infoX - x) - 8;

  if (body.showPhoto) {
    setStroke(doc, primaryColor);
    doc.lineWidth(1.5).rect(photoX, bodyY, photoSize, photoSize).stroke();
    let photoBuf = teacher.photo ? await fetchImageBuffer(teacher.photo) : null;
    if (photoBuf) {
      try {
        drawImageCover(
          doc,
          photoBuf,
          photoX + 1.5,
          bodyY + 1.5,
          photoSize - 3,
          photoSize - 3,
        );
      } catch {
        photoBuf = null;
      }
    }
    if (!photoBuf) {
      setFill(doc, "#e0f2f1");
      doc.rect(photoX + 1, bodyY + 1, photoSize - 2, photoSize - 2).fill();
      setFill(doc, primaryColor);
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
          (teacher.name || "").slice(0, 2).toUpperCase(),
          photoX + 1,
          bodyY + photoSize / 2 - 8,
          { width: photoSize - 2, align: "center" },
        );
    }
  }

  let infoY = bodyY;
  const fieldRows = [];
  if (body.showName)
    fieldRows.push({ type: "name", value: teacher.name || "" });
  if (body.showId)
    fieldRows.push({
      type: "field",
      label: "Employee ID",
      value: teacher.employeeId,
    });
  if (body.showDesignation)
    fieldRows.push({
      type: "field",
      label: "Designation",
      value: teacher.subjects || "Teacher",
    });
  if (body.showDepartment && teacher.subjects)
    fieldRows.push({
      type: "field",
      label: "Subject(s)",
      value: trunc(teacher.subjects, 18),
    });
  if (body.showDob)
    fieldRows.push({
      type: "field",
      label: "DOB",
      value: fmtDate(teacher.dob),
    });
  if (body.showBloodGroup && teacher.bloodGroup)
    fieldRows.push({
      type: "field",
      label: "Blood Group",
      value: teacher.bloodGroup,
    });
  if (body.showContact)
    fieldRows.push({ type: "field", label: "Contact", value: teacher.phone });
  if (body.showJoiningDate && teacher.dateOfJoining)
    fieldRows.push({
      type: "field",
      label: "Joined",
      value: fmtDate(teacher.dateOfJoining),
    });

  // Evenly distribute rows across the available info column height.
  // Each "field" row needs room for a label line + a value line; a gap
  // below that minimum causes the next row's label to overlap this row's
  // value (the text-overlap bug seen on staff A4 sheets). So rowGap has a
  // hard floor of 12pt for fields (and 13pt for the name row, which is
  // taller), and we shrink font size instead of shrinking the gap when
  // there isn't enough vertical room for all rows.
  const validRows = fieldRows.filter((r) => r.value);
  const availInfoH = Math.max(photoSize, 40); // total vertical space for all rows
  const fieldRowMinH = 12;
  const nameRowMinH = 13;
  const rowCountForHeight =
    validRows.length + (validRows[0]?.type === "name" ? 1 : 0); // name row counts a bit extra
  const idealGap = Math.round(availInfoH / Math.max(1, validRows.length));

  // Shrink font/labels slightly when many fields must fit in limited height,
  // but never let the gap itself drop below the minimum needed to avoid overlap.
  const useCompact = idealGap < fieldRowMinH && validRows.length > 5;
  const rowGap = Math.max(fieldRowMinH, Math.min(15, idealGap));
  const labelFontSize = useCompact ? 3.5 : 4;
  const valueFontSize = useCompact ? 5 : 5.5;
  const valueOffsetY = useCompact ? 3.5 : 4;

  validRows.forEach((row) => {
    if (row.type === "name") {
      setFill(doc, primaryColor);
      doc
        .fontSize(useCompact ? 7 : 7.5)
        .font("Helvetica-Bold")
        .text(trunc(row.value, 24), infoX, infoY, {
          width: infoW,
          // lineBreak: false,
        });
      infoY += Math.max(nameRowMinH, rowGap) + 2;
    } else {
      setFill(doc, "#546e7a");
      doc
        .fontSize(labelFontSize)
        .font("Helvetica")
        .text(row.label, infoX, infoY, { width: infoW });
      setFill(doc, "#212121");
      doc
        .fontSize(valueFontSize)
        .font("Helvetica-Bold")
        // .text(trunc(String(row.value), 20), infoX, infoY + valueOffsetY, {
        //   width: infoW,
        // });
        .text(trunc(String(row.value), 20), infoX, infoY + valueOffsetY, {
          width: infoW,
          // lineBreak: false,
        });
      infoY += rowGap;
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Back sides
// ════════════════════════════════════════════════════════════════════════════

async function drawStudentBack(doc, student, template, x, y, W, H) {
  const back = template.backSide || {};
  const brand = template.branding || {};
  const primaryColor = brand.primaryColor || "#1a237e";

  setFill(doc, back.backgroundColor || "#f5f5f5");
  doc.rect(x, y, W, H).fill();
  setFill(doc, primaryColor);
  doc.rect(x, y, W, 2).fill();

  let curY = y + 8;
  if (back.showQrCode) {
    const qrData =
      student.qrCode ||
      `${process.env.APP_BASE_URL || "https://app.brainbuilder.com"}/verify/student/${student._id}`;
    const qrSize = Math.round(H * 0.42);
    await drawQR(doc, qrData, x + 6, curY, qrSize, primaryColor);
    setFill(doc, "#757575");
    doc
      .fontSize(4.5)
      .font("Helvetica")
      .text("Scan to Verify", x + 6, curY + qrSize + 2, {
        width: qrSize,
        align: "center",
      });

    const infoX2 = x + qrSize + 12;
    const infoW2 = W - infoX2 - x - 4;
    setFill(doc, "#212121");
    doc
      .fontSize(5)
      .font("Helvetica-Bold")
      .text(
        trunc(`${student.firstName || ""} ${student.lastName || ""}`, 20),
        infoX2,
        curY,
        { width: infoW2 },
      );
    doc
      .fontSize(5)
      .font("Helvetica")
      .text(`ID: ${student.admissionNo || ""}`, infoX2, curY + 8, {
        width: infoW2,
      });
    if (student.bloodGroup)
      doc
        .fontSize(5)
        .font("Helvetica")
        .text(`Blood: ${student.bloodGroup}`, infoX2, curY + 16, {
          width: infoW2,
        });
    if (student.parentDetails?.primaryPhone)
      doc
        .fontSize(5)
        .font("Helvetica")
        .text(
          `Emergency: ${student.parentDetails.primaryPhone}`,
          infoX2,
          curY + 24,
          { width: infoW2 },
        );
  }

  if (back.showEmergencyContact) {
    const ecY = y + H - 30;
    setFill(doc, "#ffebee");
    doc.rect(x + 4, ecY, W - 8, 18).fill();
    setFill(doc, "#c62828");
    doc
      .fontSize(5.5)
      .font("Helvetica-Bold")
      .text("In case of emergency, please contact:", x + 6, ecY + 2, {
        width: W - 12,
      });
    setFill(doc, "#212121");
    doc
      .fontSize(5)
      .font("Helvetica")
      .text(
        `${student.parentDetails?.primaryName || ""}  |  ${student.parentDetails?.primaryPhone || ""}`,
        x + 6,
        ecY + 10,
        { width: W - 12 },
      );
  }
  if (back.showSignatureArea) {
    const sigY = y + H - 10;
    setStroke(doc, "#bdbdbd");
    doc
      .lineWidth(0.5)
      .moveTo(x + W - 60, sigY)
      .lineTo(x + W - 8, sigY)
      .stroke();
    setFill(doc, "#9e9e9e");
    doc
      .fontSize(4)
      .font("Helvetica")
      .text("Authorised Signature", x + W - 60, sigY + 1, {
        width: 52,
        align: "center",
      });
  }
  setFill(doc, brand.accentColor || "#ffd600");
  doc.rect(x, y + H - 2, W, 2).fill();
}

async function drawStaffBack(doc, teacher, template, x, y, W, H) {
  const back = template.backSide || {};
  const brand = template.branding || {};
  const primaryColor = brand.primaryColor || "#004d40";

  setFill(doc, back.backgroundColor || "#f5f5f5");
  doc.rect(x, y, W, H).fill();
  setFill(doc, primaryColor);
  doc.rect(x, y, W, 2).fill();

  let curY = y + 8;
  if (back.showQrCode) {
    const qrData =
      teacher.qrCode ||
      `${process.env.APP_BASE_URL || "https://app.brainbuilder.com"}/verify/staff/${teacher._id}`;
    const qrSize = Math.round(H * 0.42);
    await drawQR(doc, qrData, x + 6, curY, qrSize, primaryColor);
    setFill(doc, "#757575");
    doc
      .fontSize(4.5)
      .font("Helvetica")
      .text("Scan to Verify", x + 6, curY + qrSize + 2, {
        width: qrSize,
        align: "center",
      });

    const infoX2 = x + qrSize + 12;
    const infoW2 = W - infoX2 - x - 4;
    setFill(doc, "#212121");
    doc
      .fontSize(5.5)
      .font("Helvetica-Bold")
      .text(trunc(teacher.name, 20), infoX2, curY, { width: infoW2 });
    doc
      .fontSize(5)
      .font("Helvetica")
      .text(`ID: ${teacher.employeeId || ""}`, infoX2, curY + 8, {
        width: infoW2,
      });
    if (teacher.phone)
      doc
        .fontSize(5)
        .font("Helvetica")
        .text(`Ph: ${teacher.phone}`, infoX2, curY + 16, { width: infoW2 });
    if (teacher.bloodGroup)
      doc
        .fontSize(5)
        .font("Helvetica")
        .text(`Blood: ${teacher.bloodGroup}`, infoX2, curY + 24, {
          width: infoW2,
        });
  }
  if (back.showEmergencyContact && teacher.emergencyContact) {
    const ecY = y + H - 30;
    setFill(doc, "#ffebee");
    doc.rect(x + 4, ecY, W - 8, 18).fill();
    setFill(doc, "#c62828");
    doc
      .fontSize(5.5)
      .font("Helvetica-Bold")
      .text("Emergency Contact:", x + 6, ecY + 2, { width: W - 12 });
    setFill(doc, "#212121");
    doc
      .fontSize(5)
      .font("Helvetica")
      .text(teacher.emergencyContact, x + 6, ecY + 10, { width: W - 12 });
  }
  if (back.showSignatureArea) {
    const sigY = y + H - 10;
    setStroke(doc, "#bdbdbd");
    doc
      .lineWidth(0.5)
      .moveTo(x + W - 60, sigY)
      .lineTo(x + W - 8, sigY)
      .stroke();
    setFill(doc, "#9e9e9e");
    doc
      .fontSize(4)
      .font("Helvetica")
      .text("Authorised Signature", x + W - 60, sigY + 1, {
        width: 52,
        align: "center",
      });
  }
  setFill(doc, brand.accentColor || "#00796b");
  doc.rect(x, y + H - 2, W, 2).fill();
}

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

async function generateStudentIdCardPDF(student, template) {
  return new Promise(async (resolve, reject) => {
    try {
      const isPortrait = template.orientation === "portrait";
      const W = isPortrait ? PORTRAIT.W : CARD.W;
      const H = isPortrait ? PORTRAIT.H : CARD.H;
      const hasBack = template.backSide?.enabled === true;
      const doc = new PDFDocument({
        size: hasBack ? [W, H * 2 + 10] : [W, H],
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `ID Card - ${student.firstName} ${student.lastName}`,
          Author: "BrainBuilder School ERP",
        },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      await drawStudentFront(doc, student, template, 0, 0, W, H);
      if (hasBack) {
        setFill(doc, "#eeeeee");
        doc.rect(0, H, W, 10).fill();
        await drawStudentBack(doc, student, template, 0, H + 10, W, H);
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateStaffIdCardPDF(teacher, template) {
  return new Promise(async (resolve, reject) => {
    try {
      const isPortrait = template.orientation === "portrait";
      const W = isPortrait ? PORTRAIT.W : CARD.W;
      const H = isPortrait ? PORTRAIT.H : CARD.H;
      const hasBack = template.backSide?.enabled === true;
      const doc = new PDFDocument({
        size: hasBack ? [W, H * 2 + 10] : [W, H],
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `Staff ID Card - ${teacher.name}`,
          Author: "BrainBuilder School ERP",
        },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      await drawStaffFront(doc, teacher, template, 0, 0, W, H);
      if (hasBack) {
        setFill(doc, "#eeeeee");
        doc.rect(0, H, W, 10).fill();
        await drawStaffBack(doc, teacher, template, 0, H + 10, W, H);
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateBulkStudentIdCardPDF(students, template) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!students.length) return reject(new Error("No students provided"));
      const isPortrait = template.orientation === "portrait";
      const W = isPortrait ? PORTRAIT.W : CARD.W;
      const H = isPortrait ? PORTRAIT.H : CARD.H;
      const hasBack = template.backSide?.enabled === true;
      const pageH = hasBack ? H * 2 + 10 : H;
      const doc = new PDFDocument({
        size: [W, pageH],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: "Bulk Student ID Cards",
          Author: "BrainBuilder School ERP",
        },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      for (const student of students) {
        doc.addPage({ size: [W, pageH], margin: 0 });
        await drawStudentFront(doc, student, template, 0, 0, W, H);
        if (hasBack) {
          setFill(doc, "#eeeeee");
          doc.rect(0, H, W, 10).fill();
          await drawStudentBack(doc, student, template, 0, H + 10, W, H);
        }
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function generateBulkStaffIdCardPDF(teachers, template) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!teachers.length) return reject(new Error("No staff provided"));
      const isPortrait = template.orientation === "portrait";
      const W = isPortrait ? PORTRAIT.W : CARD.W;
      const H = isPortrait ? PORTRAIT.H : CARD.H;
      const hasBack = template.backSide?.enabled === true;
      const pageH = hasBack ? H * 2 + 10 : H;
      const doc = new PDFDocument({
        size: [W, pageH],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: "Bulk Staff ID Cards",
          Author: "BrainBuilder School ERP",
        },
      });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      for (const teacher of teachers) {
        doc.addPage({ size: [W, pageH], margin: 0 });
        await drawStaffFront(doc, teacher, template, 0, 0, W, H);
        if (hasBack) {
          setFill(doc, "#eeeeee");
          doc.rect(0, H, W, 10).fill();
          await drawStaffBack(doc, teacher, template, 0, H + 10, W, H);
        }
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateStudentIdCardPDF,
  generateStaffIdCardPDF,
  generateBulkStudentIdCardPDF,
  generateBulkStaffIdCardPDF,
};

// ════════════════════════════════════════════════════════════════════════════
// A4 BULK PRINTING SHEETS
//
// NEW, ADDITIONAL functions only. They do NOT modify or replace any existing
// card-rendering logic above — they reuse drawStudentFront/drawStudentBack/
// drawStaffFront/drawStaffBack exactly as-is, just placed at different (x, y)
// coordinates on an A4 page instead of a single-card page.
//
// Actual card sizes are NEVER changed:
//   Student card: 90mm x 59mm (landscape) -> CARD.W x CARD.H
//   Staff card:   59mm x 90mm (portrait)  -> PORTRAIT.W x PORTRAIT.H
// ════════════════════════════════════════════════════════════════════════════

const A4 = {
  width: 595.28, // PDFKit points (210mm)
  height: 841.89, // PDFKit points (297mm)
};

const MARGIN_MM = 15;
const GAP_MM = 8;
const MARGIN = MARGIN_MM * MM_TO_PT;
const GAP = GAP_MM * MM_TO_PT;

/**
 * Draw crop marks just outside a card's bounding box, on all 4 corners.
 * Marks are short black lines that sit in the gap/margin area — they never
 * overlap the card design itself, since they start just outside (x,y,w,h).
 */
function drawCropMarks(doc, x, y, w, h) {
  const markLen = 10; // length of each crop mark line, in points
  const offset = 3; // gap between card edge and start of crop mark

  doc.save();
  doc.lineWidth(0.6);
  doc.strokeColor("#000000");

  const corners = [
    // top-left
    [
      [x - offset, y],
      [x - offset - markLen, y],
    ],
    [
      [x, y - offset],
      [x, y - offset - markLen],
    ],
    // top-right
    [
      [x + w + offset, y],
      [x + w + offset + markLen, y],
    ],
    [
      [x + w, y - offset],
      [x + w, y - offset - markLen],
    ],
    // bottom-left
    [
      [x - offset, y + h],
      [x - offset - markLen, y + h],
    ],
    [
      [x, y + h + offset],
      [x, y + h + offset + markLen],
    ],
    // bottom-right
    [
      [x + w + offset, y + h],
      [x + w + offset + markLen, y + h],
    ],
    [
      [x + w, y + h + offset],
      [x + w, y + h + offset + markLen],
    ],
  ];

  corners.forEach(([from, to]) => {
    doc.moveTo(from[0], from[1]).lineTo(to[0], to[1]).stroke();
  });

  doc.restore();
}

/**
 * Compute a grid of (x, y) top-left positions for `cols` x `rows` cards of
 * size (cardW, cardH) on an A4 page, using MARGIN as the outer page margin
 * and GAP as the spacing between adjacent cards. Positions are centered
 * as a block within the printable area (in case of small leftover space).
 */
function computeA4Grid(cardW, cardH, cols, rows) {
  // const printableW = A4.width - MARGIN * 2;
  // const printableH = A4.height - MARGIN * 2;

  // const gridW = cols * cardW + (cols - 1) * GAP;
  // const gridH = rows * cardH + (rows - 1) * GAP;

  // // Center the grid block within the printable area
  // const startX = MARGIN + Math.max(0, (printableW - gridW) / 2);
  // const startY = MARGIN + Math.max(0, (printableH - gridH) / 2);

  const printableW = A4.width - MARGIN * 2;

  const printableH = A4.height - MARGIN * 2;

  const gridW = cols * cardW + (cols - 1) * GAP;

  const gridH = rows * cardH + (rows - 1) * GAP;

  // perfectly center

  const startX = (A4.width - gridW) / 2;

  const startY = (A4.height - gridH) / 2;

  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        x: startX + c * (cardW + GAP),
        y: startY + r * (cardH + GAP),
      });
    }
  }
  return positions;
}

/**
 * Split a flat array into chunks of a given size.
 * Used to paginate records across multiple A4 sheets.
 */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── STUDENT A4 SHEET: 2 cols x 5 rows = 10 cards/page ──────────────────────
// const STUDENT_A4_COLS = 2;
// const STUDENT_A4_ROWS = 5;
// const STUDENT_A4_PER_PAGE = STUDENT_A4_COLS * STUDENT_A4_ROWS; // 10

const STUDENT_A4_COLS = 2;
const STUDENT_A4_ROWS = 4;

const STUDENT_A4_PER_PAGE = STUDENT_A4_COLS * STUDENT_A4_ROWS; // 8

/**
 * Generate an A4 print sheet PDF for bulk student ID cards.
 * Always uses the student's native landscape size (CARD.W x CARD.H) —
 * never scaled, stretched, or resized.
 *
 * If template.backSide.enabled === true, output alternates:
 *   Page N   (odd)  -> fronts for that batch of up to 10 students
 *   Page N+1 (even) -> backs for the SAME batch, same grid positions
 *
 * Memory-efficient: processes students in batches of STUDENT_A4_PER_PAGE,
 * so peak memory holds only one page's worth of image buffers at a time —
 * safe for 1000+ records.
 *
 * @param {Array} students - array of student records
 * @param {Object} template - ID card template (same shape used elsewhere)
 * @returns {Promise<Buffer>} - the generated PDF as a buffer
 */
async function generateStudentA4SheetPDF(students, template) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!students || !students.length)
        return reject(new Error("No students provided"));

      const hasBack = template.backSide?.enabled === true;
      const cardW = CARD.W;
      const cardH = CARD.H;
      const positions = computeA4Grid(
        cardW,
        cardH,
        STUDENT_A4_COLS,
        STUDENT_A4_ROWS,
      );
      const batches = chunkArray(students, STUDENT_A4_PER_PAGE);

      const doc = new PDFDocument({
        size: [A4.width, A4.height],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: "Bulk Student ID Cards - A4 Print Sheet",
          Author: "BrainBuilder School ERP",
        },
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      for (const batch of batches) {
        // ── Front page for this batch ──────────────────────────────────────
        doc.addPage({ size: [A4.width, A4.height], margin: 0 });
        for (let i = 0; i < batch.length; i++) {
          const { x, y } = positions[i];
          await drawStudentFront(doc, batch[i], template, x, y, cardW, cardH);
          drawCropMarks(doc, x, y, cardW, cardH);
        }

        // ── Back page for the SAME batch, same positions ───────────────────
        if (hasBack) {
          doc.addPage({ size: [A4.width, A4.height], margin: 0 });
          for (let i = 0; i < batch.length; i++) {
            const { x, y } = positions[i];
            await drawStudentBack(doc, batch[i], template, x, y, cardW, cardH);
            drawCropMarks(doc, x, y, cardW, cardH);
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── STAFF A4 SHEET: 3 cols x 3 rows = 9 cards/page ──────────────────────────
// const STAFF_A4_COLS = 3;
// const STAFF_A4_ROWS = 3;
// const STAFF_A4_PER_PAGE = STAFF_A4_COLS * STAFF_A4_ROWS; // 9

const STAFF_A4_COLS = 2;
const STAFF_A4_ROWS = 3;

const STAFF_A4_PER_PAGE = STAFF_A4_COLS * STAFF_A4_ROWS; // 6

/**
 * Generate an A4 print sheet PDF for bulk staff ID cards.
 * Always uses the staff card's native portrait size (PORTRAIT.W x PORTRAIT.H)
 * — never scaled, stretched, or resized.
 *
 * If template.backSide.enabled === true, output alternates front/back pages
 * per batch, same as generateStudentA4SheetPDF.
 *
 * @param {Array} teachers - array of staff/teacher records
 * @param {Object} template - ID card template
 * @returns {Promise<Buffer>} - the generated PDF as a buffer
 */
async function generateStaffA4SheetPDF(teachers, template) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!teachers || !teachers.length)
        return reject(new Error("No staff provided"));

      const hasBack = template.backSide?.enabled === true;
      const cardW = PORTRAIT.W;
      const cardH = PORTRAIT.H;
      const positions = computeA4Grid(
        cardW,
        cardH,
        STAFF_A4_COLS,
        STAFF_A4_ROWS,
      );
      const batches = chunkArray(teachers, STAFF_A4_PER_PAGE);

      const doc = new PDFDocument({
        size: [A4.width, A4.height],
        margin: 0,
        autoFirstPage: false,
        info: {
          Title: "Bulk Staff ID Cards - A4 Print Sheet",
          Author: "BrainBuilder School ERP",
        },
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      for (const batch of batches) {
        // ── Front page for this batch ──────────────────────────────────────
        doc.addPage({ size: [A4.width, A4.height], margin: 0 });
        for (let i = 0; i < batch.length; i++) {
          const { x, y } = positions[i];
          await drawStaffFront(doc, batch[i], template, x, y, cardW, cardH);
          drawCropMarks(doc, x, y, cardW, cardH);
        }

        // ── Back page for the SAME batch, same positions ───────────────────
        if (hasBack) {
          doc.addPage({ size: [A4.width, A4.height], margin: 0 });
          for (let i = 0; i < batch.length; i++) {
            const { x, y } = positions[i];
            await drawStaffBack(doc, batch[i], template, x, y, cardW, cardH);
            drawCropMarks(doc, x, y, cardW, cardH);
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports.generateStudentA4SheetPDF = generateStudentA4SheetPDF;
module.exports.generateStaffA4SheetPDF = generateStaffA4SheetPDF;
