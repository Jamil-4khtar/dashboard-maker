export default function TableWidget({ widget, isSelected, onSelect }) {
  const data = widget.config.data;
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div 
      className={`widget-content table-widget ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(widget.id)}
    >
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(col => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}