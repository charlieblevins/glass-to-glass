
function BoundBoxFields({
  title,
  prefix,
}: {
  title: string;
  prefix: string;
}) {
  const xName = prefix + "-x";
  const yName = prefix + "-y";
  const widthName = prefix + "-width";
  const heightName = prefix + "-height";

  return (
    <fieldset>
      <legend>{title}</legend>
      <div>
        <label htmlFor={xName}>X:</label>
        <input type="number" id={xName} name={xName} required />
      </div>
      <div>
        <label htmlFor={yName}>Y:</label>
        <input type="number" id={yName} name={yName} required />
      </div>
      <div>
        <label htmlFor={widthName}>Width:</label>
        <input type="number" id={widthName} name={widthName} required />
      </div>
      <div>
        <label htmlFor={heightName}>Height:</label>
        <input type="number" id={heightName} name={heightName} required />
      </div>
    </fieldset>
  );
}

export default BoundBoxFields;
