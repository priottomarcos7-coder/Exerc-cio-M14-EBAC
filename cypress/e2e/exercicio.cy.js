/// <reference types="cypress" />

describe('Testes da Funcionalidade Catálogo de Livros', () => {

     let token
     beforeEach(() => {
          cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
               token = tkn
          })
     });

     describe('GET - Teste de API - Catálogo de Livros', () => {
          it('GET - Deve listar livros com filtros e paginação', () => {
               cy.api({
                    method: 'GET',
                    url: 'books',
                    qs: {
                         category: 'Ficção',
                         author: 'Autor Teste',
                         limit: 5,
                         page: 1
                    },
                    headers: { 'Authorization': token }
               }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body).to.be.an('object')

                    const books = response.body.books || response.body.data || []
                    const pagination = response.body.pagination || response.body.meta || {}

                    expect(books).to.be.an('array')
                    expect(pagination).to.be.an('object')

                    if (books.length > 0) {
                         const sample = books[0]
                         expect(sample).to.have.property('id')
                         expect(sample).to.have.property('title')
                         expect(sample).to.have.property('author')
                    }

                    if (Object.keys(pagination).length > 0) {
                         expect(pagination).to.have.any.keys('page', 'limit', 'total', 'pages')
                    }
               })
          })
     })

     // Objetivo: Validar que é possível obter detalhes de um livro específico pelo ID
     // Verificar que todos os campos do livro são retornados corretamente
     it('GET - Deve obter detalhes de um livro específico', () => {
          cy.api({ method: 'GET', url: 'books', headers: { 'Authorization': token } })
               .its('body.books')
               .then(books => {
                    const ids = books || []
                    expect(ids).to.be.an('array').and.to.not.be.empty
                    const bookId = ids[0].id || ids[0]._id || ids[0].idLivro || ids[0].id
                    expect(bookId).to.exist

                    cy.api({ method: 'GET', url: `books/${bookId}`, headers: { 'Authorization': token } })
                         .should(response => {
                              expect(response.status).to.equal(200)
                              expect(response.body).to.be.an('object')
                              expect(response.body.book).to.have.any.keys('id', 'title', 'author', 'category')
                         })
               })
     });

     // Objetivo: Validar que um novo livro é adicionado com sucesso ao catálogo
     // Verificar que apenas admin pode adicionar novos livros (validação de permissão)
     it('POST - Deve cadastrar um novo livro com sucesso', () => {
          const novolivro = {
               title: `Livro de Teste ${Date.now()}`,
               author: 'Autor de Teste',
               category: 'Testes',
               description: 'Livro cadastrado via teste automatizado'
          }

          cy.api({
               method: 'POST',
               url: '/books',
               headers: { Authorization: token },
               body: novolivro
          }).should((response) => {
               expect(response.status).to.be.oneOf([200, 201])
          })

          it('POST - Não deve permitir usuário comum cadastrar livro', () => {

               const novolivro = {
                    title: `Livro de Teste ${Date.now()}`,
                    author: 'Autor de Teste',
                    category: 'Testes',
                    description: 'Teste de permissão'
               }

               const tokenUsuario = 'COLOQUE_AQUI_TOKEN_SEM_ADMIN'

               cy.api({
                    method: 'POST',
                    url: '/books',
                    headers: { Authorization: `Bearer ${tokenUsuario}` },
                    body: novolivro,
                    failOnStatusCode: false
               }).then((response) => {

                    expect(response.status).to.be.oneOf([401, 403])
                    expect(response.body.message).to.exist

               })
          })
     });

     // Objetivo: Garantir que dados inválidos são rejeitados ao adicionar um livro
     // Validar mensagens de erro apropriadas para dados faltantes ou incorretos
     it('POST -  Deve rejeitar livro com dados inválidos', () => {
          const livroInvalido = {
               title: '',
               author: '',
               category: ''
          }

          cy.api({
               method: 'POST',
               url: 'books',
               headers: { 'Authorization': token },
               body: livroInvalido,
               failOnStatusCode: false
          }).then(response => {
               expect(response.status).to.be.oneOf([400, 422])
               expect(response.body).to.be.an('object')
               expect(response.body).to.have.any.keys('message', 'error', 'errors')
          })
     });

     // Objetivo: Validar que um livro pode ser atualizado com sucesso
     // Verificar que apenas admin pode atualizar livros (validação de permissão)
     it('PUT - Deve atualizar livro', () => {
          cy.criarLivro(token).then(id => {

               cy.api({
                    method: 'PUT',
                    url: `books/${id}`,
                    headers: { Authorization: token },
                    body: {
                         title: `Atualizado ${Date.now()}`,
                         author: 'Autor',
                         category: 'Testes',
                         description: 'Update'
                    }
               }).then(res => {
                    expect(res.status).to.equal(200)
               })

          })
     })

     // Objetivo: Validar que um livro pode ser removido do catálogo
     // Verificar que apenas admin pode deletar livros (validação de permissão)
     it('DELETE - Deve deletar livro', () => {
          cy.criarLivro(token).then(id => {

               cy.api({
                    method: 'DELETE',
                    url: `books/${id}`,
                    headers: { Authorization: token }
               }).then(res => {
                    expect(res.status).to.be.oneOf([200, 204])
               })

          })
     })
});
