import { useState } from "react";

const FormArithmetic = ({ onSubmit }) => {
    const [inputText, setInputText] = useState('');

    const clickButton = () => {
        onSubmit(inputText);
    }
    
    return (
        <div className="flex gap-4">
            <input className="bg-blue-50 rounded-md w-3xs !pl-1.5" type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}/>
            <button className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white transition-all ease-in-out rounded-md !p-2" onClick={clickButton}>Проверить</button>
        </div>
    )
}

export default FormArithmetic;