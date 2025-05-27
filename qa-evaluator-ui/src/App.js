import React, { useState } from 'react';
import axios from 'axios';
import { Send, MessageCircle, ThumbsUp, ThumbsDown, AlertCircle, Loader, BarChart3, TrendingUp, Scale, Brain, RotateCcw, MessageSquare, X } from 'lucide-react';
import './App.css';

// Your Railway backend URL
const API_BASE_URL = 'https://llm-qna-evaluator-v2-production.up.railway.app/api';

const formatAnswerText = (text) => {
  if (!text) return '';
  
  return text
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert bullet points starting with * to proper list items
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    // Wrap consecutive list items in <ul>
    .replace(/(<li>.*<\/li>)/gs, (match) => {
      const items = match.split('</li>').filter(item => item.trim());
      return '<ul>' + items.map(item => item + '</li>').join('') + '</ul>';
    })
    // Convert line breaks to <br>
    .replace(/\n/g, '<br>')
    // Convert headings (### to h3, ## to h2, # to h1)
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Convert numbered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Handle code blocks with backticks
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Handle superscript
    .replace(/<sup>(.*?)<\/sup>/g, '<sup>$1</sup>');
};

function App() {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regeneratingId, setRegeneratingId] = useState(null);
  
  // Feedback states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        question: question.trim()
      });

      const newConversation = {
        id: Date.now(),
        question: question.trim(),
        answer: response.data.answer,
        evaluation: response.data.evaluation,
        timestamp: new Date().toLocaleString(),
        feedback: null // Initialize feedback
      };

      setConversations(prev => [newConversation, ...prev]);
      setQuestion('');
    } catch (err) {
      setError('Failed to get answer. Please check your connection.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAnswer = async (conversationId, originalQuestion) => {
    setRegeneratingId(conversationId);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        question: originalQuestion
      });

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              answer: response.data.answer,
              evaluation: response.data.evaluation,
              timestamp: new Date().toLocaleString() + ' (Regenerated)',
              feedback: null // Reset feedback on regeneration
            }
          : conv
      ));
    } catch (err) {
      setError('Failed to regenerate answer. Please check your connection.');
      console.error('Error:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  // Feedback functions
  const handleFeedback = (conversationId, type) => {
    if (type === 'comment') {
      setFeedbackModalOpen(conversationId);
      setFeedbackComment('');
    } else {
      // Quick thumbs feedback
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              feedback: {
                type: type,
                timestamp: new Date().toLocaleString(),
                comment: null
              }
            }
          : conv
      ));
    }
  };

  const submitFeedbackComment = async () => {
    if (!feedbackComment.trim()) return;

    setSubmittingFeedback(true);

    try {
      // Update conversation with feedback
      setConversations(prev => prev.map(conv => 
        conv.id === feedbackModalOpen 
          ? {
              ...conv,
              feedback: {
                type: 'comment',
                comment: feedbackComment.trim(),
                timestamp: new Date().toLocaleString()
              }
            }
          : conv
      ));

      // Close modal
      setFeedbackModalOpen(null);
      setFeedbackComment('');

      // Here you could also send feedback to your backend
      // await axios.post(`${API_BASE_URL}/feedback`, {
      //   conversationId: feedbackModalOpen,
      //   feedback: feedbackComment.trim()
      // });

    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  const getQualityIcon = (quality) => {
    switch (quality) {
      case 'GOOD':
        return <ThumbsUp className="quality-icon good" />;
      case 'BAD':
        return <ThumbsDown className="quality-icon bad" />;
      default:
        return <AlertCircle className="quality-icon error" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 7) return 'score-excellent';
    if (score >= 5) return 'score-good';
    if (score >= 3) return 'score-average';
    return 'score-poor';
  };

  const getMetricColor = (value) => {
    if (value >= 0.7) return 'metric-excellent';
    if (value >= 0.5) return 'metric-good';
    if (value >= 0.3) return 'metric-average';
    return 'metric-poor';
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-info">
            <Scale className="header-icon" />
            <div>
              <h1 className="header-title">LLM-as-a-Judge Q&A Evaluator</h1>
              <p className="header-subtitle">AI-powered evaluation using LLM-as-a-Judge + ROUGE & BLEU metrics</p>
            </div>
            <div className="method-badge">
              <Brain className="method-icon" />
              <span>LLM Judge</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Question Input */}
        <div className="input-section">
          <div className="input-container">
            <div className="textarea-container">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your question here... (Press Enter to submit, Shift+Enter for new line)"
                className="question-textarea"
                rows="3"
                disabled={loading}
              />
            </div>
            <button
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              className={`ask-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <Loader className="button-icon spinning" />
              ) : (
                <Send className="button-icon" />
              )}
              {loading ? 'Processing...' : 'Evaluate'}
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Conversations */}
        <div className="conversations">
          {conversations.map((conv) => (
            <div key={conv.id} className="conversation-card">
              {/* Question */}
              <div className="question-section">
                <div className="question-header">
                  <div className="question-avatar">
                    <MessageCircle className="avatar-icon" />
                  </div>
                  <div className="question-content">
                    <h3 className="section-title">Question</h3>
                    <p className="question-text">{conv.question}</p>
                    <p className="timestamp">{conv.timestamp}</p>
                  </div>
                  <div className="question-actions">
                    <button
                      onClick={() => regenerateAnswer(conv.id, conv.question)}
                      disabled={regeneratingId === conv.id}
                      className={`regenerate-button ${regeneratingId === conv.id ? 'loading' : ''}`}
                      title="Regenerate answer for this question"
                    >
                      {regeneratingId === conv.id ? (
                        <Loader className="regenerate-icon spinning" />
                      ) : (
                        <RotateCcw className="regenerate-icon" />
                      )}
                      {regeneratingId === conv.id ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Answer */}
              <div className="answer-section">
                <div className="answer-header">
                  <h3 className="section-title">Answer</h3>
                  
                  {/* Feedback Buttons */}
                  <div className="feedback-buttons">
                    <button
                      onClick={() => handleFeedback(conv.id, 'thumbs_up')}
                      className={`feedback-button thumbs-up ${conv.feedback?.type === 'thumbs_up' ? 'active' : ''}`}
                      title="This answer was helpful"
                    >
                      <ThumbsUp className="feedback-icon" />
                    </button>
                    <button
                      onClick={() => handleFeedback(conv.id, 'thumbs_down')}
                      className={`feedback-button thumbs-down ${conv.feedback?.type === 'thumbs_down' ? 'active' : ''}`}
                      title="This answer was not helpful"
                    >
                      <ThumbsDown className="feedback-icon" />
                    </button>
                    <button
                      onClick={() => handleFeedback(conv.id, 'comment')}
                      className={`feedback-button comment ${conv.feedback?.type === 'comment' ? 'active' : ''}`}
                      title="Add detailed feedback"
                    >
                      <MessageSquare className="feedback-icon" />
                    </button>
                  </div>
                </div>

                <div className="answer-content">
                  <div 
                    className="answer-text-formatted" 
                    dangerouslySetInnerHTML={{
                      __html: formatAnswerText(conv.answer)
                    }}
                  />
                </div>

                {/* Display feedback if provided */}
                {conv.feedback && (
                  <div className="feedback-display">
                    <div className="feedback-header">
                      {conv.feedback.type === 'thumbs_up' && <ThumbsUp className="feedback-display-icon positive" />}
                      {conv.feedback.type === 'thumbs_down' && <ThumbsDown className="feedback-display-icon negative" />}
                      {conv.feedback.type === 'comment' && <MessageSquare className="feedback-display-icon comment" />}
                      <span className="feedback-text">
                        {conv.feedback.type === 'thumbs_up' && 'You found this answer helpful'}
                        {conv.feedback.type === 'thumbs_down' && 'You found this answer not helpful'}
                        {conv.feedback.type === 'comment' && 'Your feedback'}
                      </span>
                      <span className="feedback-timestamp">{conv.feedback.timestamp}</span>
                    </div>
                    {conv.feedback.comment && (
                      <div className="feedback-comment">
                        "{conv.feedback.comment}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Evaluation */}
              {conv.evaluation && conv.evaluation.quality !== 'ERROR' && (
                <div className={`evaluation-section ${conv.evaluation.quality.toLowerCase()}`}>
                  {/* LLM Judge Header */}
                  <div className="llm-judge-header">
                    <Scale className="judge-icon" />
                    <div className="judge-info">
                      <h3 className="judge-title">LLM-as-a-Judge Evaluation</h3>
                      <span className="judge-model">
                        {conv.evaluation.judge_model || 'Gemini Judge'} • 
                        Confidence: {conv.evaluation.judge_confidence || 0}/10
                      </span>
                    </div>
                    <div className="judge-verdict">
                      {getQualityIcon(conv.evaluation.llm_judge_verdict || conv.evaluation.quality)}
                      <span className="verdict-text">
                        {conv.evaluation.llm_judge_verdict || conv.evaluation.quality}
                      </span>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="overall-score">
                    <span className="score-badge large">
                      Overall Quality: {conv.evaluation.score}/10
                    </span>
                    <span className="evaluation-method">
                      Method: {conv.evaluation.evaluation_method || 'LLM-as-a-Judge + NLP Metrics'}
                    </span>
                  </div>

                  {/* LLM Judge Detailed Scores */}
                  <div className="detailed-scores">
                    <h4 className="scores-title">
                      <Brain className="brain-icon" />
                      LLM Judge Detailed Assessment
                    </h4>
                    <div className="score-grid">
                      <div className="score-item">
                        <span className="score-label">Content Depth</span>
                        <span className={`score-value ${getScoreColor(conv.evaluation.content_depth || 0)}`}>
                          {conv.evaluation.content_depth || 0}/10
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Actionability</span>
                        <span className={`score-value ${getScoreColor(conv.evaluation.actionability || 0)}`}>
                          {conv.evaluation.actionability || 0}/10
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Clarity</span>
                        <span className={`score-value ${getScoreColor(conv.evaluation.clarity || 0)}`}>
                          {conv.evaluation.clarity || 0}/10
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Comprehensiveness</span>
                        <span className={`score-value ${getScoreColor(conv.evaluation.comprehensiveness || 0)}`}>
                          {conv.evaluation.comprehensiveness || 0}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Objective NLP Metrics */}
                  {conv.evaluation.metrics_summary && (
                    <div className="metrics-section">
                      <div className="metrics-header">
                        <TrendingUp className="metrics-icon" />
                        <h4 className="metrics-title">Objective NLP Metrics</h4>
                        <span className="metrics-note">(Supporting Evidence)</span>
                      </div>
                      <div className="metrics-grid">
                        <div className="metric-item">
                          <span className="metric-label">Overall Similarity</span>
                          <span className={`metric-value ${getMetricColor(conv.evaluation.metrics_summary.overall_similarity)}`}>
                            {(conv.evaluation.metrics_summary.overall_similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">ROUGE-1</span>
                          <span className={`metric-value ${getMetricColor(conv.evaluation.metrics_summary.rouge1_fmeasure)}`}>
                            {(conv.evaluation.metrics_summary.rouge1_fmeasure * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">ROUGE-L</span>
                          <span className={`metric-value ${getMetricColor(conv.evaluation.metrics_summary.rougeL_fmeasure)}`}>
                            {(conv.evaluation.metrics_summary.rougeL_fmeasure * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">BLEU</span>
                          <span className={`metric-value ${getMetricColor(conv.evaluation.metrics_summary.bleu_score)}`}>
                            {(conv.evaluation.metrics_summary.bleu_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="metrics-interpretation">
                        📝 {conv.evaluation.metrics_summary.interpretation}
                      </p>
                    </div>
                  )}

                  <div className="evaluation-content">
                    <div className="reasoning-section">
                      <h4 className="subsection-title">
                        <Brain className="reasoning-icon" />
                        LLM Judge Reasoning
                      </h4>
                      <p className="reasoning-text">{conv.evaluation.reasoning}</p>
                    </div>

                    <div className="details-section">
                      {conv.evaluation.strengths && conv.evaluation.strengths.length > 0 && (
                        <div className="strengths">
                          <h4 className="subsection-title strengths-title">✨ Identified Strengths</h4>
                          <ul className="details-list">
                            {conv.evaluation.strengths.map((strength, index) => (
                              <li key={index} className="detail-item strength-item">
                                <span className="bullet">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {conv.evaluation.missing_elements && conv.evaluation.missing_elements.length > 0 && (
                        <div className="improvements">
                          <h4 className="subsection-title improvements-title">🔧 Improvement Suggestions</h4>
                          <ul className="details-list">
                            {conv.evaluation.missing_elements.map((element, index) => (
                              <li key={index} className="detail-item improvement-item">
                                <span className="bullet">•</span>
                                <span>{element}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {conv.evaluation && conv.evaluation.quality === 'ERROR' && (
                <div className="evaluation-section error">
                  <div className="evaluation-header">
                    <AlertCircle className="quality-icon error" />
                    <h3 className="section-title">LLM Judge Error</h3>
                  </div>
                  <p className="error-text">{conv.evaluation.reasoning}</p>
                </div>
              )}
            </div>
          ))}

          {conversations.length === 0 && (
            <div className="empty-state">
              <Scale className="empty-icon" />
              <h3 className="empty-title">Ready for LLM-as-a-Judge Evaluation</h3>
              <p className="empty-description">
                Ask your first question to see advanced AI evaluation using the LLM-as-a-Judge methodology!
              </p>
              <div className="methodology-info">
                <h4>🏛️ LLM-as-a-Judge Features:</h4>
                <ul>
                  <li>Expert-level qualitative assessment</li>
                  <li>Detailed reasoning and confidence scores</li>
                  <li>Combined with objective NLP metrics (ROUGE, BLEU)</li>
                  <li>User feedback collection for continuous improvement</li>
                </ul>
              </div>
              <div className="example-questions">
                <p>Try questions like:</p>
                <ul>
                  <li>"How do I improve team productivity?"</li>
                  <li>"What's the best deployment strategy?"</li>
                  <li>"How to debug performance issues?"</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="feedback-modal-overlay">
          <div className="feedback-modal">
            <div className="feedback-modal-header">
              <h3>Provide Detailed Feedback</h3>
              <button
                onClick={() => setFeedbackModalOpen(null)}
                className="close-button"
              >
                <X className="close-icon" />
              </button>
            </div>
            <div className="feedback-modal-content">
              <p>Help us improve by sharing your thoughts on this answer:</p>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="What did you think about this answer? Was it helpful? What could be improved?"
                className="feedback-textarea"
                rows="4"
              />
            </div>
            <div className="feedback-modal-actions">
              <button
                onClick={() => setFeedbackModalOpen(null)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedbackComment}
                disabled={!feedbackComment.trim() || submittingFeedback}
                className="submit-button"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
