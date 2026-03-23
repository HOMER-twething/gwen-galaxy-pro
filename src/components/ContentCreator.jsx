import React, { useState, useRef } from 'react';

export const ContentCreator = ({ onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('words');
  const [customWords, setCustomWords] = useState([]);
  const [customMathProblems, setCustomMathProblems] = useState([]);
  const [customImages, setCustomImages] = useState([]);
  const fileInputRef = useRef(null);
  
  const [newWord, setNewWord] = useState({
    word: '',
    difficulty: 'easy',
    category: 'custom',
    hint: '',
    image: null
  });
  
  const [newMathProblem, setNewMathProblem] = useState({
    question: '',
    answer: '',
    difficulty: 'easy',
    type: 'addition',
    hints: []
  });

  const handleAddWord = () => {
    if (newWord.word.trim()) {
      const word = {
        ...newWord,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      const updatedWords = [...customWords, word];
      setCustomWords(updatedWords);
      saveToLocalStorage('customWords', updatedWords);
      
      // Reset form
      setNewWord({
        word: '',
        difficulty: 'easy',
        category: 'custom',
        hint: '',
        image: null
      });
    }
  };

  const handleAddMathProblem = () => {
    if (newMathProblem.question && newMathProblem.answer) {
      const problem = {
        ...newMathProblem,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      const updatedProblems = [...customMathProblems, problem];
      setCustomMathProblems(updatedProblems);
      saveToLocalStorage('customMathProblems', updatedProblems);
      
      // Reset form
      setNewMathProblem({
        question: '',
        answer: '',
        difficulty: 'easy',
        type: 'addition',
        hints: []
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = {
          id: Date.now(),
          name: file.name,
          data: e.target.result,
          size: file.size,
          createdAt: new Date().toISOString()
        };
        
        const updatedImages = [...customImages, image];
        setCustomImages(updatedImages);
        saveToLocalStorage('customImages', updatedImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      alert('Storage is full. Please delete some content.');
    }
  };

  const loadFromLocalStorage = (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  };

  const exportContent = () => {
    const content = {
      words: customWords,
      mathProblems: customMathProblems,
      images: customImages.map(img => ({
        ...img,
        data: null // Don't export actual image data to keep file small
      })),
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(content, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `custom_content_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importContent = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          
          if (content.words) {
            setCustomWords(content.words);
            saveToLocalStorage('customWords', content.words);
          }
          
          if (content.mathProblems) {
            setCustomMathProblems(content.mathProblems);
            saveToLocalStorage('customMathProblems', content.mathProblems);
          }
          
          alert('Content imported successfully!');
        } catch (error) {
          alert('Failed to import content. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const deleteItem = (type, id) => {
    if (type === 'word') {
      const updated = customWords.filter(w => w.id !== id);
      setCustomWords(updated);
      saveToLocalStorage('customWords', updated);
    } else if (type === 'math') {
      const updated = customMathProblems.filter(p => p.id !== id);
      setCustomMathProblems(updated);
      saveToLocalStorage('customMathProblems', updated);
    } else if (type === 'image') {
      const updated = customImages.filter(i => i.id !== id);
      setCustomImages(updated);
      saveToLocalStorage('customImages', updated);
    }
  };

  // Load saved content on mount
  React.useEffect(() => {
    setCustomWords(loadFromLocalStorage('customWords'));
    setCustomMathProblems(loadFromLocalStorage('customMathProblems'));
    setCustomImages(loadFromLocalStorage('customImages'));
  }, []);

  return (
    <div className="content-creator">
      <div className="creator-header">
        <h1>✏️ Content Creator</h1>
        <p>Create personalized learning content for your child</p>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="creator-tabs">
        <button 
          className={activeTab === 'words' ? 'active' : ''}
          onClick={() => setActiveTab('words')}
        >
          📝 Custom Words
        </button>
        <button 
          className={activeTab === 'math' ? 'active' : ''}
          onClick={() => setActiveTab('math')}
        >
          🔢 Math Problems
        </button>
        <button 
          className={activeTab === 'images' ? 'active' : ''}
          onClick={() => setActiveTab('images')}
        >
          🖼️ Images
        </button>
        <button 
          className={activeTab === 'import' ? 'active' : ''}
          onClick={() => setActiveTab('import')}
        >
          📤 Import/Export
        </button>
      </div>

      <div className="creator-content">
        {activeTab === 'words' && (
          <div className="words-tab">
            <div className="input-section">
              <h3>Add New Word</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Enter word..."
                  value={newWord.word}
                  onChange={(e) => setNewWord({...newWord, word: e.target.value.toUpperCase()})}
                  maxLength="20"
                />
                
                <select
                  value={newWord.difficulty}
                  onChange={(e) => setNewWord({...newWord, difficulty: e.target.value})}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Category (e.g., Animals)"
                  value={newWord.category}
                  onChange={(e) => setNewWord({...newWord, category: e.target.value})}
                />
                
                <input
                  type="text"
                  placeholder="Hint (optional)"
                  value={newWord.hint}
                  onChange={(e) => setNewWord({...newWord, hint: e.target.value})}
                />
                
                <button onClick={handleAddWord} className="add-btn">
                  ➕ Add Word
                </button>
              </div>
            </div>

            <div className="list-section">
              <h3>Your Custom Words ({customWords.length})</h3>
              <div className="word-list">
                {customWords.map(word => (
                  <div key={word.id} className="word-item">
                    <span className="word-text">{word.word}</span>
                    <span className={`difficulty ${word.difficulty}`}>
                      {word.difficulty}
                    </span>
                    <span className="category">{word.category}</span>
                    {word.hint && <span className="hint">💡 {word.hint}</span>}
                    <button 
                      onClick={() => deleteItem('word', word.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {customWords.length === 0 && (
                  <p className="empty-message">No custom words yet. Add your first word above!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'math' && (
          <div className="math-tab">
            <div className="input-section">
              <h3>Create Math Problem</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Question (e.g., 5 + 3 = ?)"
                  value={newMathProblem.question}
                  onChange={(e) => setNewMathProblem({...newMathProblem, question: e.target.value})}
                />
                
                <input
                  type="text"
                  placeholder="Answer"
                  value={newMathProblem.answer}
                  onChange={(e) => setNewMathProblem({...newMathProblem, answer: e.target.value})}
                />
                
                <select
                  value={newMathProblem.type}
                  onChange={(e) => setNewMathProblem({...newMathProblem, type: e.target.value})}
                >
                  <option value="addition">Addition</option>
                  <option value="subtraction">Subtraction</option>
                  <option value="multiplication">Multiplication</option>
                  <option value="division">Division</option>
                  <option value="word_problem">Word Problem</option>
                </select>
                
                <select
                  value={newMathProblem.difficulty}
                  onChange={(e) => setNewMathProblem({...newMathProblem, difficulty: e.target.value})}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <button onClick={handleAddMathProblem} className="add-btn">
                  ➕ Add Problem
                </button>
              </div>
            </div>

            <div className="list-section">
              <h3>Your Math Problems ({customMathProblems.length})</h3>
              <div className="problem-list">
                {customMathProblems.map(problem => (
                  <div key={problem.id} className="problem-item">
                    <span className="problem-question">{problem.question}</span>
                    <span className="problem-answer">= {problem.answer}</span>
                    <span className={`difficulty ${problem.difficulty}`}>
                      {problem.difficulty}
                    </span>
                    <span className="type">{problem.type.replace('_', ' ')}</span>
                    <button 
                      onClick={() => deleteItem('math', problem.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {customMathProblems.length === 0 && (
                  <p className="empty-message">No custom math problems yet. Create your first problem above!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="images-tab">
            <div className="upload-section">
              <h3>Upload Images</h3>
              <p>Add custom images for personalized content</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              
              <button 
                onClick={() => fileInputRef.current.click()}
                className="upload-btn"
              >
                📤 Choose Image
              </button>
            </div>

            <div className="images-grid">
              {customImages.map(image => (
                <div key={image.id} className="image-item">
                  <img src={image.data} alt={image.name} />
                  <div className="image-info">
                    <span className="image-name">{image.name}</span>
                    <button 
                      onClick={() => deleteItem('image', image.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {customImages.length === 0 && (
                <p className="empty-message">No custom images yet. Upload your first image above!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="import-tab">
            <div className="import-export-section">
              <h3>📥 Import Content</h3>
              <p>Import previously exported content</p>
              <input
                type="file"
                accept=".json"
                onChange={importContent}
                className="file-input"
              />
            </div>

            <div className="import-export-section">
              <h3>📤 Export Content</h3>
              <p>Save your custom content to a file</p>
              <button onClick={exportContent} className="export-btn">
                Download Content File
              </button>
            </div>

            <div className="stats-section">
              <h3>📊 Content Statistics</h3>
              <div className="stats-grid">
                <div className="stat">
                  <span className="stat-value">{customWords.length}</span>
                  <span className="stat-label">Custom Words</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{customMathProblems.length}</span>
                  <span className="stat-label">Math Problems</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{customImages.length}</span>
                  <span className="stat-label">Images</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .content-creator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .creator-header {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
        }

        .creator-header h1 {
          margin: 0;
          font-size: 28px;
        }

        .creator-header p {
          margin: 5px 0 0;
          opacity: 0.9;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
        }

        .creator-tabs {
          display: flex;
          background: #f5f5f5;
          border-bottom: 2px solid #ddd;
        }

        .creator-tabs button {
          flex: 1;
          padding: 15px;
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
        }

        .creator-tabs button.active {
          background: white;
          border-bottom: 3px solid #667eea;
          font-weight: bold;
        }

        .creator-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .input-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }

        .form-grid input,
        .form-grid select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }

        .add-btn {
          background: #4caf50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .add-btn:hover {
          background: #45a049;
        }

        .list-section h3 {
          color: #333;
          margin-bottom: 15px;
        }

        .word-list,
        .problem-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .word-item,
        .problem-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 5px;
        }

        .word-text,
        .problem-question {
          font-weight: bold;
          font-size: 18px;
          flex: 1;
        }

        .difficulty {
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          text-transform: uppercase;
        }

        .difficulty.easy {
          background: #4caf50;
          color: white;
        }

        .difficulty.medium {
          background: #ff9800;
          color: white;
        }

        .difficulty.hard {
          background: #f44336;
          color: white;
        }

        .category,
        .type {
          background: #e0e0e0;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 14px;
        }

        .hint {
          color: #666;
          font-size: 14px;
        }

        .delete-btn {
          background: #f44336;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }

        .empty-message {
          text-align: center;
          color: #999;
          padding: 40px;
          font-style: italic;
        }

        .upload-btn,
        .export-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          display: inline-block;
          margin-top: 10px;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .image-item {
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }

        .image-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .image-info {
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f5f5f5;
        }

        .image-name {
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .import-export-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .file-input {
          margin-top: 10px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 20px;
        }

        .stat {
          text-align: center;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 10px;
        }

        .stat-value {
          display: block;
          font-size: 36px;
          font-weight: bold;
          color: #667eea;
        }

        .stat-label {
          display: block;
          margin-top: 5px;
          color: #666;
        }
      `}</style>
    </div>
  );
};