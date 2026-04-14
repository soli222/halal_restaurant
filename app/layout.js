import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata = {
  title: 'HalalSpot — Find Certified Halal Restaurants',
  description: 'Discover certified halal restaurants near you. Real reviews from the Muslim community.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.className} min-h-screen bg-[#0A0A0A] text-gray-100`}>
        {children}
      </body>
    </html>
  )
}
