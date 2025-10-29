import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchTopBoughtProducts } from '../../api';
import './OftenBought.css';

export default function OftenBought({ limit = 8 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await fetchTopBoughtProducts(limit);
        if (!mounted) return;
        if (data?.success) {
          setItems(data.products || []);
        } else {
          setError(data?.message || 'Failed to load products');
        }
      } catch (e) {
        setError(e.message || 'Network error');
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [limit]);

  const shimmer = useMemo(() => new Array(Math.min(limit, 8)).fill(0), [limit]);

  return (
    <section className="ob-section">
      <div className="ob-header">
        <h3 className="ob-title">Often Bought</h3>
        <p className="ob-sub">Most-loved picks, updated from recent orders</p>
      </div>

      {error && !loading && (
        <div className="ob-error">{error}</div>
      )}

      {/* Moving Polaroid Train */}
      {loading ? (
        <div className="ob-train">
          <div className="ob-train-viewport">
            <div className="ob-train-track">
              {shimmer.map((_, i) => (
                <div key={i} className="ob-polaroid ob-skeleton">
                  <div className="ob-polaroid-photo" />
                  <div className="ob-polaroid-caption"><div className="ob-line w-60" /></div>
                </div>
              ))}
            </div>
            <div className="ob-rails" aria-hidden>
              <div className="ob-rail" />
              <div className="ob-rail ob-rail--bottom" />
            </div>
          </div>
        </div>
      ) : (
        (() => {
          const withId = items.filter(p => p.productId);
          const base = (withId.length ? withId : items).slice(0, Math.max(6, (withId.length || items.length)));
          const loop = [...base, ...base];
          const duration = `${Math.max(18, base.length * 4)}s`;
          return (
            <div className="ob-train">
              <div className="ob-train-viewport" style={{ ['--ob-speed']: duration }}>
                <div className="ob-train-track">
                  {loop.map((p, i) => {
                    const deg = ((i % 7) - 3) * 1.2; // -3.6deg..+4.8deg
                    const imgSrc = p.image?.startsWith('http') ? p.image : (p.image ? `http://localhost:5000${p.image}` : null);
                    const Card = (
                      <div className="ob-polaroid" style={{ ['--tilt']: `${deg}deg` }}>
                        <div className="ob-polaroid-photo">
                          {imgSrc ? (
                            <img src={imgSrc} alt={p.name} loading="lazy" />
                          ) : (
                            <div className="ob-photo-fallback" aria-label={p.name} />
                          )}
                          <span className="ob-sold">{p.totalSold || 0} sold</span>
                        </div>
                        <div className="ob-polaroid-caption">
                          <span className="ob-cap-name" title={p.name}>{p.name}</span>
                          {p.price != null && <span className="ob-cap-price">₹{Number(p.price).toFixed(0)}</span>}
                        </div>
                      </div>
                    );
                    return p.productId ? (
                      <Link to={`/products/${p.productId}`} key={`${p.productId}-${i}`} className="ob-polaroid-link">
                        {Card}
                      </Link>
                    ) : (
                      <div key={i} className="ob-polaroid-link" role="article" aria-label={p.name}>
                        {Card}
                      </div>
                    );
                  })}
                </div>
                <div className="ob-rails" aria-hidden>
                  <div className="ob-rail" />
                  <div className="ob-rail ob-rail--bottom" />
                </div>
              </div>
            </div>
          );
        })()
      )}
    </section>
  );
}
