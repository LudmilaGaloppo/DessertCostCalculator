import IngredientCalculator from './pages/IngredientCalculator';
import RecipeEditor from './pages/RecipeEditor';
import { useState } from 'react';

/** Permite elegir entre el catálogo de insumos y el editor de recetas. */
export default function App() {
  const [page, setPage] = useState<'supplies' | 'recipes'>('supplies');
  return <>
    <header className="topbar">
      <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">dc</span><span>Desserts Cost</span></a>
      <nav className="page-nav" aria-label="Secciones">
        <button type="button" aria-pressed={page === 'supplies'} onClick={() => setPage('supplies')}>Insumos</button>
        <button type="button" aria-pressed={page === 'recipes'} onClick={() => setPage('recipes')}>Recetas</button>
      </nav>
    </header>
    {page === 'supplies' ? <IngredientCalculator /> : <RecipeEditor />}
  </>;
}
