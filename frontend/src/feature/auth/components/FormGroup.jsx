import React from 'react'

const FormGroup = ({label,placeholder,type,value,error,onChange}) => {
  return (
    <div>
        <label  htmlFor={label}>{label}</label>
        <input value={value} onChange={onChange} type={type} id={label} name={label} placeholder={placeholder}  />
        {error && <span>{error}</span>}
        
    </div>
  )
}

export default FormGroup