import { CLASSES } from '../constants/classes';

export default function IconInput({ 
  icon: Icon, 
  name, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  maxLength,
  disabled = false 
}) {
  return (
    <div className={CLASSES.grupoInput}>
      <Icon className={CLASSES.iconeInput} />
      <input
        className={CLASSES.input}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        disabled={disabled}
      />
    </div>
  );
}