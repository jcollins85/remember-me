interface Props {
    value: string;
    onChange: (val: string) => void;
  }
  
  export default function SearchBar({ value, onChange }: Props) {
    return (
      <div className="max-w-xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Search by name, venue, role, description, or tags..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }
  