
export default function MainHeader() {

    return (
        <header className="bg-gray-800 text-white py-3 px-6 flex justify-between items-center ">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold">Event Header</h1>
            </div>
            <div className="flex items-center">
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-white text-gray-800 font-semibold cursor-pointer hover:bg-gray-200">
                    HH
                </div>
            </div>
        </header>
    )
}