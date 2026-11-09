interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Also namespaces the test ids — the drawer renders one per line. */
  id?: string;
  /** Describes which item this controls, for screen readers. */
  label?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  id = 'quantity',
  label,
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const suffix = label ? ` for ${label}` : '';

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`Decrease quantity${suffix}`}
        data-testid={`${id}-decrease`}
      >
        −
      </button>

      {/* type="text" with inputMode="numeric": a number input's spinners
          duplicate the buttons either side of it, and its scroll-to-change
          behaviour changes the value by accident. */}
      <input
        id={id}
        className="stepper__input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        aria-label={`Quantity${suffix}`}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          if (digits === '') return;
          onChange(clamp(Number(digits)));
        }}
        onBlur={(event) => {
          if (event.target.value.replace(/\D/g, '') === '') onChange(min);
        }}
        data-testid={`${id}-input`}
      />

      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`Increase quantity${suffix}`}
        data-testid={`${id}-increase`}
      >
        +
      </button>
    </div>
  );
}
