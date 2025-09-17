import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Button, Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFilter,
    faTimes,
    faMicrophone,
    faHistory,
    faChartLine,
    faMusic
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({
    onSearch,
    placeholder = "Rechercher des sons, artistes...",
    showFilters = true,
    size = 'normal',
    className = ''
}) => {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const inputRef = useRef(null);
    const suggestionRef = useRef(null);
    const navigate = useNavigate();

    // Suggestions mockées avec catégories
    const suggestions = {
        trending: [
            "Afrobeat moderne",
            "Makossa fusion",
            "Coupé-décalé 2024"
        ],
        categories: [
            "Hip-Hop camerounais",
            "Musique traditionnelle",
            "Beats urbains",
            "Sons d'ambiance"
        ],
        artists: [
            "DJ Cameroun",
            "UrbanSonic",
            "BeatMaker237"
        ]
    };

    const filters = [
        { id: 'free', label: 'Gratuit', color: 'success' },
        { id: 'premium', label: 'Premium', color: 'warning' },
        { id: 'new', label: 'Nouveau', color: 'info' },
        { id: 'popular', label: 'Populaire', color: 'danger' }
    ];

    // Charger les recherches récentes
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Fermer les suggestions lors du clic extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (searchQuery = query) => {
        if (!searchQuery.trim()) return;

        // Ajouter à l'historique
        const newRecentSearches = [
            searchQuery,
            ...recentSearches.filter(s => s !== searchQuery)
        ].slice(0, 5);

        setRecentSearches(newRecentSearches);
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

        // Effectuer la recherche
        if (onSearch) {
            onSearch(searchQuery, selectedFilters);
        } else {
            const params = new URLSearchParams();
            params.set('search', searchQuery);
            if (selectedFilters.length > 0) {
                params.set('filters', selectedFilters.join(','));
            }
            navigate(`/catalog?${params.toString()}`);
        }

        setShowSuggestions(false);
        inputRef.current?.blur();
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        handleSearch(suggestion);
    };

    const toggleFilter = (filterId) => {
        setSelectedFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    };

    const clearFilters = () => {
        setSelectedFilters([]);
    };

    const startVoiceSearch = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('La reconnaissance vocale n\'est pas supportée par votre navigateur');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = false;

        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            handleSearch(transcript);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const sizeStyles = {
        small: {
            input: { fontSize: '13px', padding: '8px 12px' },
            button: { padding: '8px 12px' }
        },
        normal: {
            input: { fontSize: '14px', padding: '12px 16px' },
            button: { padding: '12px 20px' }
        },
        large: {
            input: { fontSize: '16px', padding: '16px 20px' },
            button: { padding: '16px 24px' }
        }
    };

    return (
        <div className={`search-bar-container position-relative ${className}`} ref={suggestionRef}>
            <Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
                <InputGroup className="search-input-advanced">
                    {/* Filtres actifs */}
                    {selectedFilters.length > 0 && (
                        <div className="search-filters-display position-absolute" style={{ top: '-32px', left: 0 }}>
                            <div className="d-flex gap-1 align-items-center">
                                {selectedFilters.map(filterId => {
                                    const filter = filters.find(f => f.id === filterId);
                                    return (
                                        <Badge
                                            key={filterId}
                                            bg={filter.color}
                                            className="d-flex align-items-center gap-1 small"
                                            style={{ fontSize: '11px' }}
                                        >
                                            {filter.label}
                                            <FontAwesomeIcon
                                                icon={faTimes}
                                                className="cursor-pointer"
                                                onClick={() => toggleFilter(filterId)}
                                                style={{ fontSize: '10px' }}
                                            />
                                        </Badge>
                                    );
                                })}
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="p-0 text-muted"
                                    style={{ fontSize: '11px' }}
                                >
                                    Effacer
                                </Button>
                            </div>
                        </div>
                    )}

                    <Form.Control
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        className="search-input-styled"
                        style={{
                            borderRadius: size === 'small' ? '20px 0 0 20px' : '25px 0 0 25px',
                            border: '2px solid rgba(139, 92, 246, 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            ...sizeStyles[size].input
                        }}
                    />

                    {/* Bouton reconnaissance vocale */}
                    {('webkitSpeechRecognition' in window) && (
                        <Button
                            type="button"
                            variant="outline-secondary"
                            onClick={startVoiceSearch}
                            disabled={isListening}
                            className={`voice-search-btn ${isListening ? 'listening' : ''}`}
                            style={{
                                borderRadius: 0,
                                borderLeft: 'none',
                                borderRight: 'none',
                                ...sizeStyles[size].button
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faMicrophone}
                                className={isListening ? 'text-danger' : ''}
                            />
                        </Button>
                    )}

                    {/* Bouton filtres */}
                    {showFilters && (
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="outline-secondary"
                                className="filter-btn"
                                style={{
                                    borderRadius: 0,
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    ...sizeStyles[size].button
                                }}
                            >
                                <FontAwesomeIcon icon={faFilter} />
                                {selectedFilters.length > 0 && (
                                    <Badge bg="danger" className="ms-1" style={{ fontSize: '9px' }}>
                                        {selectedFilters.length}
                                    </Badge>
                                )}
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="filter-menu" style={{ borderRadius: '12px', padding: '12px' }}>
                                <div className="mb-2">
                                    <small className="text-muted fw-bold">Filtres</small>
                                </div>
                                {filters.map(filter => (
                                    <Form.Check
                                        key={filter.id}
                                        type="checkbox"
                                        id={`filter-${filter.id}`}
                                        label={filter.label}
                                        checked={selectedFilters.includes(filter.id)}
                                        onChange={() => toggleFilter(filter.id)}
                                        className="mb-2"
                                    />
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    )}

                    {/* Bouton recherche */}
                    <Button
                        type="submit"
                        className="search-submit-btn"
                        style={{
                            borderRadius: size === 'small' ? '0 20px 20px 0' : '0 25px 25px 0',
                            background: 'linear-gradient(135deg, var(--primary-purple), var(--primary-blue))',
                            border: 'none',
                            ...sizeStyles[size].button
                        }}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                    </Button>
                </InputGroup>

                {/* Suggestions et historique */}
                {showSuggestions && (query || recentSearches.length > 0) && (
                    <div
                        className="search-suggestions-advanced position-absolute w-100"
                        style={{
                            top: '100%',
                            zIndex: 1000,
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            marginTop: '4px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}
                    >
                        {/* Recherches récentes */}
                        {!query && recentSearches.length > 0 && (
                            <div className="suggestion-section p-3 border-bottom">
                                <div className="d-flex align-items-center mb-2">
                                    <FontAwesomeIcon icon={faHistory} className="me-2 text-muted" />
                                    <small className="text-muted fw-bold">Récemment recherchés</small>
                                </div>
                                {recentSearches.map((search, index) => (
                                    <div
                                        key={index}
                                        className="suggestion-item p-2 cursor-pointer"
                                        onClick={() => handleSuggestionClick(search)}
                                    >
                                        <FontAwesomeIcon icon={faHistory} className="me-2 text-muted" style={{ fontSize: '12px' }} />
                                        {search}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Suggestions tendances */}
                        {query && (
                            <>
                                <div className="suggestion-section p-3 border-bottom">
                                    <div className="d-flex align-items-center mb-2">
                                        <FontAwesomeIcon icon={faChartLine} className="me-2 text-warning" />
                                        <small className="text-muted fw-bold">Tendances</small>
                                    </div>
                                    {suggestions.trending
                                        .filter(s => s.toLowerCase().includes(query.toLowerCase()))
                                        .map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="suggestion-item p-2 cursor-pointer"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                <FontAwesomeIcon icon={faChartLine} className="me-2 text-warning" style={{ fontSize: '12px' }} />
                                                {suggestion}
                                            </div>
                                        ))
                                    }
                                </div>

                                <div className="suggestion-section p-3">
                                    <div className="d-flex align-items-center mb-2">
                                        <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" />
                                        <small className="text-muted fw-bold">Catégories</small>
                                    </div>
                                    {suggestions.categories
                                        .filter(s => s.toLowerCase().includes(query.toLowerCase()))
                                        .map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="suggestion-item p-2 cursor-pointer"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                <FontAwesomeIcon icon={faMusic} className="me-2 text-primary" style={{ fontSize: '12px' }} />
                                                {suggestion}
                                            </div>
                                        ))
                                    }
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Form>

            <style jsx>{`
                .voice-search-btn.listening {
                    animation: pulse 1s infinite;
                    color: #dc3545 !important;
                }

                .suggestion-item:hover {
                    background: rgba(139, 92, 246, 0.05);
                    border-radius: 8px;
                    transform: translateX(5px);
                    transition: all 0.2s ease;
                }

                .search-input-styled:focus {
                    border-color: var(--primary-purple) !important;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
                    background: white !important;
                }
            `}</style>
        </div>
    );
};

export default SearchBar;
