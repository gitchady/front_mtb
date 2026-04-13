export function FeatureLockedPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <p className="eyebrow">Фича-флаг</p>
        <h2 className="text-5xl font-semibold leading-[0.95] md:text-6xl">{title}</h2>
        <p className="mt-5 max-w-2xl text-base text-white/68 md:text-lg">{description}</p>
      </section>
      <section className="surface-panel">
        <p className="text-sm text-white/62">
          Оболочка остается рабочей. Галактика, квесты, награды, рефералы, KPI и симулятор продолжают работать даже при отключенном модуле.
        </p>
      </section>
    </div>
  );
}
