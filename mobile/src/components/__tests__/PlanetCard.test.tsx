// src/components/__tests__/PlanetCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import {
  PlanetCard,
  PLANET_SYMBOLS,
  PLANET_NAMES,
  SIGN_NAMES,
  houseLabel,
  planetFullLabel,
} from '../PlanetCard';

// ─── Mock-данные: все 10 планет ───────────────────────────────────────────────

const MOCK_CHART = [
  { planet: 'sun',     sign: 'aries',       degree: 15.4,  house: 1  },
  { planet: 'moon',    sign: 'cancer',      degree: 8.2,   house: 4  },
  { planet: 'mercury', sign: 'pisces',      degree: 22.7,  house: 12 },
  { planet: 'venus',   sign: 'taurus',      degree: 3.1,   house: 2  },
  { planet: 'mars',    sign: 'scorpio',     degree: 17.9,  house: 8,  retrograde: true },
  { planet: 'jupiter', sign: 'sagittarius', degree: 11.0,  house: 9  },
  { planet: 'saturn',  sign: 'capricorn',   degree: 5.5,   house: 10, retrograde: true },
  { planet: 'uranus',  sign: 'gemini',      degree: 29.3,  house: 3  },
  { planet: 'neptune', sign: 'libra',       degree: 14.8,  house: 7  },
  { planet: 'pluto',   sign: 'aquarius',    degree: 1.2,   house: 11 },
];

// ─── Вспомогательные функции ──────────────────────────────────────────────────

describe('houseLabel', () => {
  it.each([
    [1,  '1-й дом'],
    [2,  '2-й дом'],
    [7,  '7-й дом'],
    [12, '12-й дом'],
  ])('дом %i → "%s"', (house, expected) => {
    expect(houseLabel(house)).toBe(expected);
  });
});

describe('planetFullLabel', () => {
  it('формирует строку «Солнце: Овен 15° (1-й дом)»', () => {
    const label = planetFullLabel('sun', 'aries', 15.4, 1, false);
    expect(label).toBe('Солнце: Овен 15° (1-й дом)');
  });

  it('добавляет «, ретроградный» при retrograde=true', () => {
    const label = planetFullLabel('mars', 'scorpio', 17.9, 8, true);
    expect(label).toBe('Марс: Скорпион 17° (8-й дом), ретроградный');
  });

  it('использует ключ как fallback для неизвестной планеты', () => {
    const label = planetFullLabel('chiron', 'aries', 10, 1, false);
    expect(label).toBe('chiron: Овен 10° (1-й дом)');
  });
});

// ─── Справочники ─────────────────────────────────────────────────────────────

describe('PLANET_SYMBOLS', () => {
  it('содержит все 10 планет с правильными символами', () => {
    expect(PLANET_SYMBOLS.sun).toBe('☉');
    expect(PLANET_SYMBOLS.moon).toBe('☽');
    expect(PLANET_SYMBOLS.mercury).toBe('☿');
    expect(PLANET_SYMBOLS.venus).toBe('♀');
    expect(PLANET_SYMBOLS.mars).toBe('♂');
    expect(PLANET_SYMBOLS.jupiter).toBe('♃');
    expect(PLANET_SYMBOLS.saturn).toBe('♄');
    expect(PLANET_SYMBOLS.uranus).toBe('♅');
    expect(PLANET_SYMBOLS.neptune).toBe('♆');
    expect(PLANET_SYMBOLS.pluto).toBe('♇');
  });
});

describe('PLANET_NAMES', () => {
  it('переводит sun → Солнце и moon → Луна', () => {
    expect(PLANET_NAMES.sun).toBe('Солнце');
    expect(PLANET_NAMES.moon).toBe('Луна');
  });
});

describe('SIGN_NAMES', () => {
  it('переводит aries → Овен и scorpio → Скорпион', () => {
    expect(SIGN_NAMES.aries).toBe('Овен');
    expect(SIGN_NAMES.scorpio).toBe('Скорпион');
  });
});

// ─── Рендер компонента ────────────────────────────────────────────────────────

describe('PlanetCard render', () => {
  it('отображает символ, название, знак, градус и дом для Солнца', () => {
    const { getByTestId } = render(
      <PlanetCard planet="sun" sign="aries" degree={15.4} house={1} />
    );

    expect(getByTestId('planet-symbol').props.children).toBe('☉');
    expect(getByTestId('planet-name').props.children).toBe('Солнце');
    expect(getByTestId('planet-position').props.children).toBe('Овен 15°');
    expect(getByTestId('planet-house').props.children).toBe('1-й дом');
  });

  it('отображает символ Луны (☽) и правильный знак', () => {
    const { getByTestId } = render(
      <PlanetCard planet="moon" sign="cancer" degree={8.2} house={4} />
    );

    expect(getByTestId('planet-symbol').props.children).toBe('☽');
    expect(getByTestId('planet-name').props.children).toBe('Луна');
    expect(getByTestId('planet-position').props.children).toBe('Рак 8°');
    expect(getByTestId('planet-house').props.children).toBe('4-й дом');
  });

  it('обрезает дробную часть градуса (15.9 → 15°)', () => {
    const { getByTestId } = render(
      <PlanetCard planet="sun" sign="aries" degree={15.9} house={1} />
    );
    expect(getByTestId('planet-position').props.children).toBe('Овен 15°');
  });

  it('показывает ℞ при retrograde=true', () => {
    const { getByTestId } = render(
      <PlanetCard planet="mars" sign="scorpio" degree={17.9} house={8} retrograde={true} />
    );
    expect(getByTestId('retro-badge')).toBeTruthy();
  });

  it('не показывает ℞ при retrograde=false (по умолчанию)', () => {
    const { queryByTestId } = render(
      <PlanetCard planet="mars" sign="scorpio" degree={17.9} house={8} />
    );
    expect(queryByTestId('retro-badge')).toBeNull();
  });

  it('использует ★ как fallback-символ для неизвестной планеты', () => {
    const { getByTestId } = render(
      <PlanetCard planet="chiron" sign="aries" degree={10} house={1} />
    );
    expect(getByTestId('planet-symbol').props.children).toBe('★');
  });

  it('имеет корректный accessibilityLabel', () => {
    const { getByTestId } = render(
      <PlanetCard planet="sun" sign="aries" degree={15.4} house={1} />
    );
    const card = getByTestId('planet-card');
    expect(card.props.accessibilityLabel).toBe(
      'Солнце: Овен 15° (1-й дом)'
    );
  });

  it('accessibilityLabel содержит «ретроградный» для ретро-планеты', () => {
    const { getByTestId } = render(
      <PlanetCard planet="saturn" sign="capricorn" degree={5.5} house={10} retrograde={true} />
    );
    const card = getByTestId('planet-card');
    expect(card.props.accessibilityLabel).toContain('ретроградный');
  });
});

// ─── Полный mock-chart: все планеты рендерятся без ошибок ─────────────────────

describe('PlanetCard — все планеты', () => {
  it.each(MOCK_CHART)(
    '$planet в $sign $degree° (дом $house)',
    ({ planet, sign, degree, house, retrograde }) => {
      expect(() =>
        render(
          <PlanetCard
            planet={planet}
            sign={sign}
            degree={degree}
            house={house}
            retrograde={retrograde}
          />
        )
      ).not.toThrow();
    }
  );
});
