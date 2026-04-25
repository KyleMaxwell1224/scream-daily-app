export default function ProgressBar({ currentAct }) {
  return (
    <div className="sd-progress">
      {[1, 2, 3, 4].map((act) => {
        let cls = 'sd-progress-seg'
        if (act < currentAct) cls += ' completed'
        else if (act === currentAct) cls += ' active'
        else cls += ' upcoming'
        return <div key={act} className={cls} />
      })}
    </div>
  )
}
