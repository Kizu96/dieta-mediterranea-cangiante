import { Play, Video } from 'lucide-react';
import type { WorkoutExercise } from '../data/types';
import { exerciseVideoId, exerciseSearchUrl } from '../lib/exerciseVideo';

// Dettaglio esercizio: istruzioni + video dimostrativo incorporato (YouTube) +
// link a più video. Si apre come modale, come per le ricette.
export function ExerciseDetail({ exercise }: { exercise: WorkoutExercise }) {
  const videoId = exerciseVideoId(exercise.name);
  const search = exerciseSearchUrl(exercise.name);

  return (
    <div>
      {videoId ? (
        <div className="video-embed">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
            title={`Video: ${exercise.name}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="banner info" style={{ marginBottom: 12 }}>
          <Video size={15} className="ic" /> Video dimostrativo non incorporato per questo esercizio: aprilo su YouTube qui sotto.
        </div>
      )}

      <h3 className="section-label">Come si esegue</h3>
      <p>{exercise.detail}</p>

      <ul className="clean" style={{ marginBottom: 12 }}>
        <li className="small muted" style={{ padding: '3px 0' }}>
          • Muoviti lento e controllato, soprattutto in discesa.
        </li>
        <li className="small muted" style={{ padding: '3px 0' }}>
          • Respira: espira nello sforzo, inspira nel ritorno.
        </li>
        <li className="small muted" style={{ padding: '3px 0' }}>
          • Fermati se senti dolore articolare (non il normale affaticamento muscolare).
        </li>
      </ul>

      <a className="btn block" href={search} target="_blank" rel="noopener noreferrer">
        <Play size={16} className="ic" /> {videoId ? 'Altri video su YouTube' : 'Guarda i video su YouTube'}
      </a>
    </div>
  );
}
