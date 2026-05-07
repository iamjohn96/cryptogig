import Link from 'next/link'
import { Gig } from '@/lib/hooks/useGigs'

export function GigCard({ gig }: { gig: Gig }) {
  return (
    <Link href={`/gigs/${gig.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-500 transition-all cursor-pointer">

        {/* 제목 & 상태 */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-white font-semibold text-lg">{gig.title}</h3>
          <span className="bg-green-900 text-green-400 text-xs px-2 py-1 rounded-full">
            모집중
          </span>
        </div>

        {/* 설명 */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {gig.description}
        </p>

        {/* 스킬 태그 */}
        {gig.skills_required?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {gig.skills_required.map((skill) => (
              <span
                key={skill}
                className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* 예산 */}
        <div className="flex justify-between items-center">
          <span className="text-purple-400 font-bold">
            {gig.budget} {gig.currency}
          </span>
          <span className="text-gray-500 text-xs">
            {new Date(gig.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>
    </Link>
  )
}