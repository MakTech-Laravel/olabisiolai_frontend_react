import { Link } from 'react-router-dom'

export function ProfileHubFooter() {
  return (
    <footer className="mt-6 rounded-[16px] bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] mx-4 p-4 text-white lg:mt-8">
      <p className="font-heading text-[15px] font-bold">Gidira</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">
        Find trusted local businesses. Grow yours with Premium, verification and boost.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-white/90">
        <Link to="/filters" className="hover:underline">
          Browse
        </Link>
        <Link to="/messages" className="hover:underline">
          Messages
        </Link>
        <Link to="/user/settings" className="hover:underline">
          Settings
        </Link>
      </div>
    </footer>
  )
}
