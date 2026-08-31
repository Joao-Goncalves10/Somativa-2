// Importação do CSS e JS do Bootstrap via NPM
import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';

document.addEventListener('DOMContentLoaded', () => {

  // Instancia a classe Modal do Bootstrap
  const modalElement = document.getElementById('albumModal');
  const albumModal = new bootstrap.Modal(modalElement);

  // Mapeia os elementos do modal a serem atualizados
  const modalTitle = document.getElementById('modalTitle');
  const modalArtist = document.getElementById('modalArtist');
  const modalImg = document.getElementById('modalImg');
  const reviewForm = document.getElementById('reviewForm');

  // Adiciona evento de clique em todos os cards de álbuns
  const albumCards = document.querySelectorAll('.album-card');

  albumCards.forEach((card) => {
    card.addEventListener('click', () => {
      // Captura informações do card clicado
      const title = card.querySelector('.card-title').textContent;
      const artist = card.querySelector('.card-text').textContent;
      const imgSrc = card.querySelector('.card-img-top').getAttribute('src');

      // Preenche os dados no modal
      modalTitle.textContent = title;
      modalArtist.textContent = artist;
      modalImg.src = imgSrc;
      modalImg.alt = title;

      // Abre o modal
      albumModal.show();
    });
  });

  // Evento do formulário de avaliação
  if (reviewForm) {
    reviewForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert(`Avaliação para "${modalTitle.textContent}" salva com sucesso!`);
      albumModal.hide();
      reviewForm.reset();
    });
  }

});