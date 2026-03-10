import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

interface SearchParams {
  organizationId?: string;
  page?: string;
}

export default async function OrgNewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  const sp = await searchParams;
  const organizationId = sp.organizationId ?? (session?.user?.organizationId ?? undefined);
  const isAdmin = session?.user?.role === 'ADMIN';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;

  const [news, total] = await Promise.all([
    prisma.orgNews.findMany({
      where,
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.orgNews.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Org-News</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Beiträge gesamt</p>
        </div>
        <Link
          href="/dashboard/org-news/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue News
        </Link>
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            Keine News vorhanden
          </div>
        ) : (
          news.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  {item.pinned && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      📌 Angepinnt
                    </span>
                  )}
                  <h2 className="text-white font-semibold">{item.title}</h2>
                </div>
                <span className="text-slate-500 text-xs flex-shrink-0">
                  {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
              <div
                className="text-slate-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800">
                <span className="text-slate-500 text-xs">
                  Von <span className="text-slate-400">{item.author.username}</span>
                </span>
                <span className="text-slate-500 text-xs">
                  {item.organization.callsign} – {item.organization.name}
                </span>
                {isAdmin && (
                  <div className="ml-auto">
                    <DeleteButton id={item.id} endpoint="/api/org-news" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-slate-400 text-sm">
            Seite {page} von {totalPages} · {total} Beiträge
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/org-news?page=${page - 1}${organizationId ? `&organizationId=${organizationId}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/org-news?page=${page + 1}${organizationId ? `&organizationId=${organizationId}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Weiter
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
