import { useState } from 'react'
import FormArithmetic from '../components/FormArithmetic'
import Grapth from '../components/Graph';
import startParser from '../utils/parser';

function ArithmeticParser() {
  const [tree, setTree] = useState(null);
  const [statusInput, setStatusInput] = useState('');

  const handleExpressionSubmit = (newExpression) => {
    const parser = startParser(newExpression);

    if (parser.status.includes('Ошибка')) {
      setStatusInput(`❌ ${parser.status}`);
      setTree(null)
      return;
    }

    setTree(parser.tree);
    setStatusInput(`✅ ${parser.status}`);
  }

  return (
    <div className='flex flex-col items-center justify-center !mt-16'>
      <FormArithmetic onSubmit={handleExpressionSubmit}/>
      
      <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-md rounded-xl !p-2 !mt-4 !mb-4 text-center font-bold max-w-md">
        <p className={statusInput.includes('Ошибка') ? 'text-red-500' : 'text-green-600'}>
          {statusInput || ''}
        </p>
      </div>

      <Grapth tree={tree}/>
    </div>
  )
}

export default ArithmeticParser
