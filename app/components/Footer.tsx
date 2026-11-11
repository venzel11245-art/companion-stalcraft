export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-xs text-gray-500 mb-2">
          TradeZon — неофициальный фанатский проект. Мы не аффилированы с EXBO Studio или Stalzone.
        </p>
        <p className="text-xs text-gray-600">
          Мы не несем ответственности за возможные неточности в данных. Используйте информацию на свой страх и риск.
          <br />
          Все права на игру Stalcraft принадлежат их законным владельцам.
        </p>
        <p className="text-xs text-gray-700 mt-4">
          © {new Date().getFullYear()} TradeZon. Made with ❤️ for the Zone.
        </p>
      </div>
    </footer>
  )
}