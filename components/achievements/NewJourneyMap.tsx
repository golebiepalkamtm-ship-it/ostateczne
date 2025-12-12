'use client';

type NewJourneyMapProps = {
  onYearSelect?: (year: number | null) => void;
};

export default function NewJourneyMap({ onYearSelect }: NewJourneyMapProps) {
  const handleYearSelect = (year: number) => {
    onYearSelect?.(year);
  };

  return (
    <div className="relative h-full w-full">
      {/* Timeline3D component removed */}
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Timeline component has been removed</p>
      </div>
    </div>
  );
}
