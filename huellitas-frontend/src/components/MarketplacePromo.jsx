import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MarketplacePromo = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('meds');

  const products = [
    { id: 1, name: "Antipulgas NexGard", category: "meds", price: "$18.50", tag: "Popular" },
    { id: 2, name: "ProPlan Adulto", category: "food", price: "$45.00", tag: "Stock" },
    { id: 3, name: "Arnés Reflectivo", category: "acc", price: "$22.00", tag: "Nuevo" },
    { id: 4, name: "Shampoo Clínico", category: "meds", price: "$12.00", tag: "Sano" }
  ];

  const filteredProducts = products.filter(p => p.category === selectedCategory);

  return (
    <section className="promo-marketplace-section" id="marketplace">
      <div className="promo-container">
        
        <div className="promo-text-content">
          <div className="badge-clean">Catálogo en línea</div>
          <h2 className="title-clean">Todo lo necesario en un <span>Solo Lugar</span></h2>
          <p className="desc-clean">
            Explora una amplia gama de medicamentos autorizados, alimentos premium y accesorios clínicos. 
            Calidad garantizada para el bienestar animal, con enlace directo a tu veterinaria de confianza.
          </p>

          <div className="marketplace-filters-clean">
            <button className={`filter-clean-btn ${selectedCategory === 'meds' ? 'active' : ''}`} onClick={() => setSelectedCategory('meds')}>Medicinas</button>
            <button className={`filter-clean-btn ${selectedCategory === 'food' ? 'active' : ''}`} onClick={() => setSelectedCategory('food')}>Alimentos</button>
            <button className={`filter-clean-btn ${selectedCategory === 'acc' ? 'active' : ''}`} onClick={() => setSelectedCategory('acc')}>Accesorios</button>
          </div>

          <button 
              onClick={() => navigate('/marketplace')} 
              className="btn-solid"
              style={{ marginTop: '2.5rem' }}
          >
              Ir al Marketplace Completo
          </button>
        </div>

        <div className="promo-visual-side">
          <div className="marketplace-grid-preview">
            {filteredProducts.map((product) => (
              <div key={product.id} className="marketplace-product-card">
                <div className="prod-badge">{product.tag}</div>
                <div className="prod-placeholder-img"></div>
                <h4>{product.name}</h4>
                <div className="prod-footer">
                  <span className="prod-price">{product.price}</span>
                  <button className="prod-add-btn">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default MarketplacePromo;