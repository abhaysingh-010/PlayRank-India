"use client"

const graphData = [40, 65, 55, 78, 72, 95]

export default function PlayerPerformanceChart() {
  const max = Math.max(...graphData)

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8">

      <div className="h-[420px] flex items-end gap-5">

        {graphData.map((value, index) => {

          const height = (value / max) * 280

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 h-full justify-end"
            >

              <p className="text-zinc-500 text-sm mb-4">
                {value}
              </p>

              <div className="w-full flex items-end justify-center h-[300px]">

                <div
                  className="w-full rounded-t-[28px] bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-300 shadow-[0_0_40px_rgba(99,102,241,0.35)] transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    height: `${height}px`,
                    minHeight: "30px",
                  }}
                />

              </div>

              <p className="mt-5 text-zinc-500 text-sm">
                M{index + 1}
              </p>

            </div>
          )
        })}
      </div>

      <div className="mt-8 border-t border-white/10 pt-6 flex justify-between text-sm text-zinc-500">
        <span>Performance Trend</span>
        <span>Last 6 Matches</span>
      </div>

    </div>
  )
}