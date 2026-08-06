export const sumFlexiFromClassTimings = (classIds = [], classTimings = {}, classesData = []) => {
  let paid = 0;
  let free = 0;
  for (const id of classIds || []) {
    const cls = classesData.find(c => c.id === id || c._id === id || c.classId === id);
    if (!cls) continue;
    const timing = classTimings?.[id] || classTimings?.[cls._id] || classTimings?.[cls.classId] || {};
    paid += Number(timing.paidFlexiHours) || 0;
    free += Number(timing.freeFlexiHours) || 0;
  }
  return { paid, free };
};
