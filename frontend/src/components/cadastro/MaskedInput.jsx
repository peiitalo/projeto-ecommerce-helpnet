import { InputMask } from '@react-input/mask';
import { FiLoader } from 'react-icons/fi';
import { CLASSES } from '../../constants/classesCadastro.js';

export default function MaskedInput({ 
  mask, 
  replacement, 
  name, 
  placeholder, 
  value, 
  onChange, 
  loading = false 
}) {
  return (
    <div className={CLASSES.grupoInput}>
      <InputMask
        mask={mask}
        replacement={replacement}
        value={value}
        onChange={onChange}
        name={name}
        className={CLASSES.input}
        placeholder={placeholder}
      />
      {loading && <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
    </div>
  );
}
