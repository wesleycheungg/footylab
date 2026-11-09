interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  id?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  id = 'quantity',
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        data-testid="quantity-decrease"
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
        aria-label="Quantity"
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          if (digits === '') return;
          onChange(clamp(Number(digits)));
        }}
        onBlur={(event) => {
          if (event.target.value.replace(/\D/g, '') === '') onChange(min);
        }}
        data-testid="quantity-input"
      />

      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        data-testid="quantity-increase"
      >
        +
      </button>
    </div>
  );
}
