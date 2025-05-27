import React from 'react';
import { Github, ExternalLink } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-info">
          <p className="footer-text">
            Developed by <span className="developer-name">Pratik Prajn</span>
          </p>
        </div>
        
        <div className="footer-links">
          <a 
            href="https://github.com/pratik-prajn/LLM-QnA-Evaluator-v2" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
            title="View source code on GitHub"
          >
            <Github className="footer-icon" />
            <span>View on GitHub</span>
            <ExternalLink className="external-icon" />
          </a>
        </div>
      </div>
      
      
    </footer>
  );
};

export default Footer;