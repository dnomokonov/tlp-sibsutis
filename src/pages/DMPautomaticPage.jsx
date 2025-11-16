

function DMPautomaticPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-xl mx-auto !space-y-8">
                <h1 className="text-2xl font-bold text-center">ДМП-автомат 👾</h1>
                <div className="flex flex-col gap-2">
                    <label htmlFor="pInput" className="flex items-center text-sm font-medium text-gray-900">
                        P=(
                        <input
                            type="text"
                            id="pInput"
                            className="flex-1 min-w-0 !px-2 !py-1.5 bg-gray-100 rounded-md text-sm"
                            placeholder="{q0,q1,q2}, {a,b}, {Z,a,b}, δ, q0, Z, {q2}"
                        />
                        )
                    </label>

                    <label htmlFor="stepFunction" className="flex flex-col text-sm font-medium text-gray-900">
                        Функции переходов
                        <textarea
                            id="stepFunction"
                            rows="10"
                            className="!mt-1 w-full !px-2 !py-2 bg-gray-100 rounded-md text-sm resize-y"
                            placeholder="Введите функции"
                        ></textarea>
                    </label>

                    <label htmlFor="strCheck" className="flex text-sm font-medium text-gray-900">
                        Строка для проверки:
                        <input
                            type="text"
                            id="strCheck"
                            className="w-full !px-2 !py-1.5 bg-gray-100 rounded-md text-sm"
                            placeholder="Введите строку"
                        />
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="w-[150px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white transition-all ease-in-out rounded-md !p-2"
                    >
                        Проверить
                    </button>
                    <button
                        className="w-[150px] bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-black transition-all ease-in-out rounded-md !p-2"
                    >
                        Очистить
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DMPautomaticPage;