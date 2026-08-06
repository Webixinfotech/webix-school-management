import PhotoCard from './PhotoCard';

export default function PhotoGrid({ photos = [], getActionItems, selectedPhotos, selectedIds, onSelect, ...rest }) {
  const ids = selectedIds || selectedPhotos || [];
  return (
    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard
          key={photo._id}
          photo={photo}
          selected={ids.includes(photo._id)}
          selectable={!!onSelect}
          onSelect={onSelect ? () => onSelect(photo._id) : undefined}
          actionItems={getActionItems ? getActionItems(photo) : []}
          {...rest}
        />
      ))}
    </div>
  );
}
