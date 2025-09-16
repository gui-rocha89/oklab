import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  FileText, 
  User, 
  Calendar,
  Clock,
  Filter,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const GlobalSearch = ({ 
  searchTerm, 
  onSearchChange, 
  projects = [], 
  users = [], 
  onResultClick,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState({
    projects: [],
    users: [],
    total: 0
  });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load search history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSearchHistory(history);
        setRecentSearches(history.slice(0, 5)); // Show only recent 5
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Perform search when searchTerm changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ projects: [], users: [], total: 0 });
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Search in projects
    const matchingProjects = projects.filter(project => 
      project.title?.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.author?.toLowerCase().includes(searchLower) ||
      project.type?.toLowerCase().includes(searchLower) ||
      project.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    ).map(project => ({
      ...project,
      type: 'project',
      matchScore: calculateMatchScore(project, searchLower)
    }));

    // Search in users (if available)
    const matchingUsers = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.cargo?.toLowerCase().includes(searchLower)
    ).map(user => ({
      ...user,
      type: 'user',
      matchScore: calculateMatchScore(user, searchLower)
    }));

    // Sort by relevance
    const sortedProjects = matchingProjects.sort((a, b) => b.matchScore - a.matchScore);
    const sortedUsers = matchingUsers.sort((a, b) => b.matchScore - a.matchScore);

    setSearchResults({
      projects: sortedProjects.slice(0, 8), // Limit results
      users: sortedUsers.slice(0, 5),
      total: matchingProjects.length + matchingUsers.length
    });
  }, [searchTerm, projects, users]);

  const calculateMatchScore = (item, searchTerm) => {
    let score = 0;
    const searchWords = searchTerm.split(' ');
    
    searchWords.forEach(word => {
      // Title/Name matches get higher score
      if (item.title?.toLowerCase().includes(word) || item.full_name?.toLowerCase().includes(word)) {
        score += 10;
      }
      // Exact matches get even higher score
      if (item.title?.toLowerCase() === word || item.full_name?.toLowerCase() === word) {
        score += 20;
      }
      // Description matches
      if (item.description?.toLowerCase().includes(word)) {
        score += 5;
      }
      // Author/email matches
      if (item.author?.toLowerCase().includes(word) || item.email?.toLowerCase().includes(word)) {
        score += 7;
      }
      // Type matches
      if (item.type?.toLowerCase().includes(word)) {
        score += 3;
      }
    });
    
    return score;
  };

  const handleSearch = (value) => {
    onSearchChange(value);
    
    // Save to search history
    if (value.trim() && !searchHistory.includes(value.trim())) {
      const newHistory = [value.trim(), ...searchHistory].slice(0, 10); // Keep last 10
      setSearchHistory(newHistory);
      setRecentSearches(newHistory.slice(0, 5));
      
      // Save to localStorage
      try {
        localStorage.setItem('search_history', JSON.stringify(newHistory));
      } catch (e) {
        console.error('Error saving search history:', e);
      }
    }
  };

  const handleResultClick = (item) => {
    if (onResultClick) {
      onResultClick(item);
    }
    setIsExpanded(false);
    onSearchChange('');
  };

  const clearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setSearchHistory([]);
    setRecentSearches([]);
    localStorage.removeItem('search_history');
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'feedback-sent': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      'feedback-sent': 'Feedback'
    };
    return texts[status] || status;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-200" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Buscar projetos, usuários..."
          className="w-full pl-10 pr-10 py-2 bg-orange-700 bg-opacity-20 border border-orange-500 rounded-lg text-white placeholder-orange-200 focus:border-white focus:ring-0 focus:bg-opacity-30 transition-all duration-200"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {searchTerm.trim() ? (
              <div className="divide-y divide-gray-100">
                {/* Search Results Header */}
                {searchResults.total > 0 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Resultados da busca ({searchResults.total})
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {searchTerm}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto">
                  {/* Projects Results */}
                  {searchResults.projects.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center space-x-2 px-2 py-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Projetos ({searchResults.projects.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.projects.map(project => (
                          <motion.button
                            key={project.id}
                            onClick={() => handleResultClick(project)}
                            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-primary">
                                    {project.title}
                                  </h4>
                                  <Badge 
                                    className={`text-xs ${getStatusColor(project.status)}`}
                                  >
                                    {getStatusText(project.status)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                  {project.description}
                                </p>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{project.author}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(project.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Users Results */}
                  {searchResults.users.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2 px-2 py-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Usuários ({searchResults.users.length})
                        </span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.users.map(user => (
                          <motion.button
                            key={user.id}
                            onClick={() => handleResultClick(user)}
                            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm group-hover:text-primary">
                                  {user.full_name}
                                </h4>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{user.email}</span>
                                  {user.cargo && (
                                    <>
                                      <span>•</span>
                                      <span>{user.cargo}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.total === 0 && searchTerm.trim() && (
                    <div className="p-8 text-center">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-gray-900 font-medium mb-2">
                        Nenhum resultado encontrado
                      </h3>
                      <p className="text-sm text-gray-500">
                        Tente usar outros termos ou verifique a grafia
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Recent Searches & Suggestions */
              <div className="divide-y divide-gray-100">
                {recentSearches.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Buscas recentes</span>
                      </div>
                      <button
                        onClick={clearHistory}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(term)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group flex items-center space-x-2"
                        >
                          <Search className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            {term}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Suggestions */}
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Sugestões populares</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Projetos pendentes',
                      'Social media',
                      'Marketing',
                      'Aprovados hoje'
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(suggestion)}
                        className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;