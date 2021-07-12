const express = require("express");
const produtos = require("./controladores/teste");

const roteador = express();

roteador.get("/produtos", produtos.listarTodosOsProdutos);
roteador.get("/carrinho", produtos.detalharCarrinho);
roteador.post("/carrinho/produtos", produtos.adicionarAoCarrinho);
roteador.patch("/carrinho/produtos/:idProduto", produtos.modificarCarrinho);
roteador.delete("/carrinho/produtos/:idProduto", produtos.removerDoCarrinho);
roteador.delete("/carrinho/", produtos.limparCarrinho);
roteador.post("/carrinho/finalizar-compra", produtos.finalizarCompra);

module.exports = roteador;