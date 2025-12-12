import {useState} from "react";
import avatar from "../assets/avatar.gif";
import {AnimatePresence} from "motion/react";
import * as motion from "motion/react-client"
import {parseTextToHTMLWithSteps} from "../utils/parseTextToHTML.js";

function ParseTextHTMLPage() {
    const [activeMenu, setActiveMenu] = useState('Program');
    const menuItems = ['Author', 'Task', 'Program'];

    const [source, setSource] = useState('');
    const [steps, setSteps] = useState([]);
    const [resultHtml, setResultHtml] = useState('');
    const [errors, setErrors] = useState([]);

    const handleTransform = () => {
      const {html, steps, errors} = parseTextToHTMLWithSteps(source);
      setResultHtml(html);
      setSteps(steps);
      setErrors(errors || []);
    };

    const handleClearInput = () => {
        setResultHtml('');
        setSource('');
        setSteps([]);
        setErrors([]);
    }

    return (
        <div className="min-h-screen flex items-start justify-center bg-gray-50">
            <div className="flex flex-col justify-center items-center !mt-30">
                <div className="w-full max-w-xl mx-auto !space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-blue-600 !mb-1">Транслятор</h1>
                        <p className="text-xl text-gray-600">
                            Транслятор из простого языка разметки в HTML
                        </p>
                    </div>

                    <div className="flex md:flex-row justify-center gap-2 w-full !space-x-2 !mb-6">
                        <ul className="flex items-center justify-center gap-2 w-full !space-x-2">
                            {menuItems.map((menuItem) => (
                                <motion.li
                                    key={menuItem}
                                    className="relative text-center !p-2 cursor-pointer"
                                    onClick={() => setActiveMenu(menuItem)}
                                >
                                    {menuItem === 'Author' && 'Автор'}
                                    {menuItem === 'Task' && 'Задание'}
                                    {menuItem === 'Program' && 'Программа'}

                                    <motion.div
                                        className="absolute bottom-0 left-1/2 h-[2px] bg-blue-700"
                                        style={{ transformOrigin: 'center' }}
                                        initial={false}
                                        animate={{
                                            scaleX: menuItem === activeMenu ? 1 : 0,
                                            translateX: '-50%',
                                            width: '100%',
                                        }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    />
                                </motion.li>

                            ))}
                        </ul>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeMenu}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeMenu === 'Author' && (
                            <div className="flex flex-col items-center justify-center gap-2 max-w-xl mx-auto !p-10 border border-gray-200 shadow-md rounded-lg bg-white">
                                <img
                                    src={avatar}
                                    width="300"
                                    className="rounded-[100%] border-4 border-emerald-500 !p-1 object-cover object-center"
                                    alt="user avatar"/>
                                <div className="flex flex-col items-center text-center">
                                    <h2 className="font-bold text-xl">Номоконов Д. А.</h2>
                                    <p className="text-gray-600">ИП-214</p>
                                </div>
                            </div>
                        )}

                        {activeMenu === 'Task' && (
                            <div
                                className="flex flex-col justify-center gap-6 max-w-xl"
                            >
                                <div className="!p-5 border border-gray-200 shadow-md rounded-lg bg-white">
                                    <p
                                        className="text-start text-base font-medium text-gray-700"
                                    >
                                        Написать транслятор из простого языка разметки в HTML. То есть,
                                        создать парсер для языка, где *текст* становится {`<i>текст</i>`}, **текст**
                                        — {`<b>текст</b>`}, и т.д.
                                    </p>
                                </div>

                                <div className="!p-5 !mb-10 border border-gray-200 shadow-md rounded-lg bg-white">
                                    <div className="flex flex-col gap-4">
                                        <h2 className="text-center font-bold text-xl">Таблица поддерживаемых конструкций</h2>
                                        <table className="min-w-full border border-gray-300 text-sm">
                                            <thead className="">
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 !px-3 !py-2 text-left font-semibold">
                                                        Конструкция
                                                    </th>
                                                    <th className="border border-gray-300 !px-3 !py-2 text-left font-semibold">
                                                        Результат
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2"># Заголовок</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<h1>Заголовок</h1>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">## Заголовок</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<h2>Заголовок</h2>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">### - ######</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<h3> - <h6>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">Обычный текст</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<p>Текст</p>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">*текст*</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<em>текст</em>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">**текст**</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<strong>текст</strong>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">***текст***</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<strong><em>текст</em></strong>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">&gt; текст</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<blockquote><p>текст</p></blockquote>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">1. элемент</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<ol><li>элемент</li>...</ol>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">- элемент</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<ul><li>элемент</li>...</ul>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">* элемент</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<ul><li>элемент</li>...</ul>`}</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 !px-3 !py-2">`код`</td>
                                                    <td className="border border-gray-300 !px-3 !py-2">{`<code>код</code>`}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeMenu === "Program" && (
                            <div className="flex flex-col items-center gap-4 w-xl !mb-4">
                                <label className="flex flex-col gap-2 text-sm font-bold text-gray-500">
                                    Простой текст
                                    <textarea
                                        className="!p-2 font-normal text-black rounded-lg bg-gray-200"
                                        cols="50"
                                        rows="10"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                    />
                                </label>

                                {errors.length > 0 && (
                                    <div className="text-red-600 text-sm">
                                        {errors.map((err, i) => (
                                            <div key={i}>{err.message}</div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        className="!px-6 !py-2 text-white rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                                        type="button"
                                        onClick={handleTransform}
                                    >
                                        Преобразовать
                                    </button>

                                    <button
                                        className="!px-6 !py-2 text-white rounded bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
                                        type="button"
                                        onClick={handleClearInput}
                                    >
                                        Очистить
                                    </button>
                                </div>

                                {steps.length > 0 && (
                                    <div className="w-full border border-gray-200 rounded-lg bg-white !p-4">
                                        <h3 className="font-bold !mb-2">Шаги трансляции</h3>
                                        <div className="overflow-auto max-h-80">
                                            <table className="min-w-full text-xs border-collapse">
                                                <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border !px-2 !py-1 text-left">Шаг</th>
                                                    <th className="border !px-2 !py-1 text-left">Тип</th>
                                                    <th className="border !px-2 !py-1 text-left">Описание</th>
                                                    <th className="border !px-2 !py-1 text-left">До</th>
                                                    <th className="border !px-2 !py-1 text-left">После</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {steps.map((step, index) => (
                                                    <tr key={index} className="align-top">
                                                        <td className="border !px-2 !py-1 whitespace-nowrap">
                                                            {index + 1}
                                                        </td>
                                                        <td className="border !px-2 !py-1 whitespace-nowrap">
                                                            {step.level || step.type || "-"}
                                                        </td>
                                                        <td className="border !px-2 !py-1 whitespace-pre-wrap max-w-[200px]">
                                                            {step.description || "-"}
                                                        </td>
                                                        <td className="border !px-2 !py-1 whitespace-pre-wrap max-w-[200px]">
                                                            {step.before ?? step.content ?? "-"}
                                                        </td>
                                                        <td className="border !px-2 !py-1 whitespace-pre-wrap max-w-[200px]">
                                                            {step.after ?? step.html ?? "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {resultHtml && (
                                    <div className="!mt-4 w-full max-w-xl grid gap-4 md:grid-cols-2">
                                        <div className="border border-gray-200 rounded-lg bg-white !p-4">
                                            <h3 className="font-bold !mb-2">Итоговый HTML (код)</h3>
                                            <pre className="text-xs whitespace-pre-wrap">{resultHtml}</pre>
                                        </div>
                                        <div className="border border-gray-200 rounded-lg bg-white !p-4">
                                            <h3 className="font-bold !mb-2">Итоговый HTML (просмотр)</h3>
                                            <div
                                                className="max-w-none !pl-4 text-left !space-y-2 [&_ul]:list-disc ![&_ul]:pl-5 [&_ol]:list-decimal ![&_ol]:pl-5 ![&_li]:my-1"
                                                dangerouslySetInnerHTML={{ __html: resultHtml }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    )
}

export default ParseTextHTMLPage;
