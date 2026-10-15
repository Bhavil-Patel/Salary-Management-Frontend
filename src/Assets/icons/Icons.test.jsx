import React from 'react';
import { render } from '@testing-library/react';
import * as Icons from './index';

describe('SVG Icons Suite', () => {
  const iconList = [
    { name: 'RefreshIcon', Component: Icons.RefreshIcon },
    { name: 'PlusIcon', Component: Icons.PlusIcon },
    { name: 'SearchIcon', Component: Icons.SearchIcon },
    { name: 'EyeIcon', Component: Icons.EyeIcon },
    { name: 'EditIcon', Component: Icons.EditIcon },
    { name: 'TrashIcon', Component: Icons.TrashIcon },
    { name: 'WarningIcon', Component: Icons.WarningIcon },
    { name: 'WarningCircleIcon', Component: Icons.WarningCircleIcon },
    { name: 'UsersIcon', Component: Icons.UsersIcon },
    { name: 'CheckIcon', Component: Icons.CheckIcon },
    { name: 'InfoIcon', Component: Icons.InfoIcon },
    { name: 'CloseIcon', Component: Icons.CloseIcon },
    { name: 'Logo', Component: Icons.Logo },
  ];

  iconList.forEach(({ name, Component }) => {
    it(`renders ${name} without throwing`, () => {
      const { container } = render(<Component data-testid={`icon-${name}`} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it(`renders ${name} with custom className and custom props`, () => {
      const { container } = render(
        <Component className="custom-test-class" data-testid={`custom-${name}`} aria-label={name} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('custom-test-class');
      expect(svg).toHaveAttribute('aria-label', name);
    });
  });
});
