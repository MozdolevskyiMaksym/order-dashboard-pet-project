import "./talk-track.scss";

export default function TalkTrack() {
  return (
    <details className="concurrency-talk">
      <summary className="concurrency-talk__summary">
        Що тут відбувається?
      </summary>

      <div className="concurrency-talk__body">
        <div className="concurrency-talk__text">
          <b>
            На цій сторінці я показую, як синхронізувати конкурентні операції в
            UI.
          </b>{" "}
          <br />
          <br />В першому блоці <b>race condition</b>: два запити йдуть
          паралельно, і повільніший може завершитися пізніше та перезаписати
          новіший стан UI. Це типовий сценарій <b>stale update</b>.
          <br />
          <br />
          Далі застосовую <b>latest-only guard</b>: кожен новий запуск підвищує
          версію, і лише останній має право комітити результат в UI. Усі старі
          відповіді відкидаються, тому стан залишається консистентним.
          <br />
          <br />
          Потім показую <b>singleflight</b>: якщо кілька викликів одночасно
          просять один і той самий ресурс, вони ділять один in-flight promise. У
          підсумку маємо менше мережевих викликів без втрати коректності
          результату.
          <br />
          <br />І на завершення — <b>semaphore</b>, який лімітує паралелізм
          (наприклад, до 3 задач одночасно), щоб не перевантажувати бекенд і
          тримати застосунок відгукливим.
        </div>

        <div className="concurrency-talk__keywords">
          Ключові терміни які я тут використовую: <b>race conditions</b>,{" "}
          <b>stale updates</b>, <b>latest-only / cancellation</b>,{" "}
          <b>deduplication</b>, <b>concurrency limiting</b>.
        </div>
      </div>
    </details>
  );
}
