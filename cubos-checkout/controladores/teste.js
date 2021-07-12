const { addBusinessDays  } = require('date-fns');
const { lerArquivo, escreverNoArquivo } = require('../bibliotecaFS');


let carrinhoPreenchido = {
  
}

function montarCarrinho(carrinho){
  return {
    subTotal: carrinho.subtotal,
    dataDeEntrega: new Date(),
    valorDoFrete: carrinho.valorDoFrete,
    totalAPagar: carrinho.totalAPagar,
    produtos: carrinho.produtos
  }
}


async function listarTodosOsProdutos(req, res){

  const listaDeProdutos = await lerArquivo();

  const categoria = req.query.categoria;
  const precoInicial = Number(req.query.precoInicial);
  const precoFinal = Number(req.query.precoFinal);
  
  if(categoria && precoInicial && precoFinal){
    const produtosCategoriaEPreco = listaDeProdutos.produtos.filter(produto => produto.categoria === categoria).filter(produto => produto.preco >= precoInicial).filter(produto => produto.preco <=precoFinal).filter(produto => produto.estoque > 0);
    res.json(produtosCategoriaEPreco);
    return;
  }

  if(precoInicial && precoFinal){
    const produtosPreco = listaDeProdutos.produtos.filter(produto => produto.preco >= precoInicial).filter(produto => produto.preco <=precoFinal).filter(produto => produto.estoque > 0);
    res.json(produtosPreco);
    return;
  }

  if(categoria){
    const produtosCategoria = listaDeProdutos.produtos.filter(produto => produto.categoria === categoria).filter(produto => produto.estoque > 0);
    res.json(produtosCategoria);
    return
  }


  res.json(listaDeProdutos.produtos.filter(produto => produto.estoque > 0));
  
  
}

async function detalharCarrinho(req, res){
  const listaDeProdutos = await lerArquivo();
  if(listaDeProdutos.carrinho.produtos.length < 1){
     res.json(listaDeProdutos.carrinho);
  }else{
    res.json(montarCarrinho(listaDeProdutos.carrinho));
  }
  
  
}

async function adicionarAoCarrinho(req, res){
   
  const listaDeProdutos = await lerArquivo();
  const produto = listaDeProdutos.produtos.find(produto=> produto.id === req.body.id);
  let quantProduto = produto.estoque;

  const novoProduto = {
    id: req.body.id,
    quantidade: req.body.quantidade,
    nome: produto.nome,
    preco: produto.preco,
    categoria: produto.categoria
 }

 if(novoProduto.quantidade <1){
   res.json({erro: "Não é possível remover produtos nessa requisição"})
   return;
 }

 const produtoNoCarrinho = listaDeProdutos.carrinho.produtos.find(produto => produto.id === novoProduto.id);

 

  if(quantProduto >= req.body.quantidade){
    if(!produtoNoCarrinho){
      
      listaDeProdutos.carrinho.produtos.push(novoProduto);
      
    }else{
      if(produtoNoCarrinho.quantidade + req.body.quantidade <= produto.estoque){
        produtoNoCarrinho.quantidade += req.body.quantidade;
        produtoNoCarrinho.preco = produto.preco;
      }else{
        res.status(400);
        res.json({erro: "O produto nao tem estoque suficiente"});
        return;
      }
      
    }
    listaDeProdutos.carrinho.dataDeEntrega = new Date();
    listaDeProdutos.carrinho.subtotal += novoProduto.preco*req.body.quantidade;
    listaDeProdutos.carrinho.subtotal < 20000 ? listaDeProdutos.carrinho.valorDoFrete = 5000 :  listaDeProdutos.carrinho.valorDoFrete = 0;
    listaDeProdutos.carrinho.totalAPagar = listaDeProdutos.carrinho.subtotal + listaDeProdutos.carrinho.valorDoFrete;
    
    if(listaDeProdutos.carrinho.produtos.length<1){
      listaDeProdutos.carrinho.dataDeEntrega = null;
    }
    
    await escreverNoArquivo(listaDeProdutos);
    
    res.json(montarCarrinho(listaDeProdutos.carrinho));
  }else{
    res.status(400);
    res.json({erro: "O produto nao tem estoque suficiente"});
  }
}

async function modificarCarrinho(req, res){
  const listaDeProdutos = await lerArquivo();
  const produto = listaDeProdutos.produtos.find(produto=> produto.id === Number(req.params.idProduto));
  const produtoNoCarrinho = listaDeProdutos.carrinho.produtos.find(produto => produto.id === Number(req.params.idProduto));

  if(!produtoNoCarrinho){
    res.status(400);
    res.json({mensagem: "Não há produtos com esse ID no carrinho"});
    return;
  }

  if(req.body.quantidade + produtoNoCarrinho.quantidade < 0){
    res.status(400);
    res.json({mensagem: `Não é possível remover essa quantidade de produtos (${req.body.quantidade}) do carrinho`});
    return;
  }

  produtoNoCarrinho.quantidade += req.body.quantidade;
  produtoNoCarrinho.preco = produto.preco;
  listaDeProdutos.carrinho.dataDeEntrega = new Date();
  listaDeProdutos.carrinho.subtotal += req.body.quantidade * produto.preco;
  listaDeProdutos.carrinho.subtotal < 20000 && listaDeProdutos.carrinho.subtotal > 0 ? listaDeProdutos.carrinho.valorDoFrete = 5000 :  listaDeProdutos.carrinho.valorDoFrete = 0;
  listaDeProdutos.carrinho.totalAPagar = listaDeProdutos.carrinho.subtotal + listaDeProdutos.carrinho.valorDoFrete;
  

  if(produtoNoCarrinho.quantidade === 0){
    const indice = listaDeProdutos.carrinho.produtos.indexOf(produtoNoCarrinho);
    listaDeProdutos.carrinho.produtos.splice(indice, 1);
  }

  if(listaDeProdutos.carrinho.produtos.length<1){
    listaDeProdutos.carrinho.dataDeEntrega = null;
  }
  
  await escreverNoArquivo(listaDeProdutos);
  

  listaDeProdutos.carrinho.produtos.length>0 ? res.json(montarCarrinho(listaDeProdutos.carrinho)):res.json(listaDeProdutos.carrinho);
}

async function removerDoCarrinho(req, res){
  const listaDeProdutos = await lerArquivo();
  const produtoNoCarrinho = listaDeProdutos.carrinho.produtos.find(produto => produto.id === Number(req.params.idProduto));

  if(!produtoNoCarrinho){
    res.status(400);
    res.json({mensagem: "Não há produtos com esse ID no carrinho"});
    return;
  }

  const indice = listaDeProdutos.carrinho.produtos.indexOf(produtoNoCarrinho);

  listaDeProdutos.carrinho.dataDeEntrega = new Date();
  listaDeProdutos.carrinho.subtotal -= produtoNoCarrinho.preco * produtoNoCarrinho.quantidade;
  listaDeProdutos.carrinho.subtotal < 20000 && listaDeProdutos.carrinho.subtotal > 0 ? listaDeProdutos.carrinho.valorDoFrete = 5000 :  listaDeProdutos.carrinho.valorDoFrete = 0;
  listaDeProdutos.carrinho.totalAPagar = listaDeProdutos.carrinho.subtotal + listaDeProdutos.carrinho.valorDoFrete;

  listaDeProdutos.carrinho.produtos.splice(indice, 1);

  if(listaDeProdutos.carrinho.produtos.length<1){
    listaDeProdutos.carrinho.dataDeEntrega = null;
  }

  await escreverNoArquivo(listaDeProdutos);

  listaDeProdutos.carrinho.produtos.length>0 ? res.json(montarCarrinho(listaDeProdutos.carrinho)):res.json(listaDeProdutos.carrinho);
}

async function limparCarrinho(req, res){
  const listaDeProdutos = await lerArquivo();

   if(listaDeProdutos.carrinho.produtos.length < 1){
     res.status(400);
     res.json({mensagem: "Não há produtos no carrinho"});
     return;
  }

  listaDeProdutos.carrinho.produtos = [];
  listaDeProdutos.carrinho.subtotal = 0;
  listaDeProdutos.carrinho.valorDoFrete = 0;
  listaDeProdutos.carrinho.dataDeEntrega = null;
  listaDeProdutos.carrinho.totalAPagar = 0;

  await escreverNoArquivo(listaDeProdutos);
  res.json({mensagem: "Carrinho limpo com sucesso"});
}

function validarCliente(cliente){
  if(!cliente.type){
    return "O campo 'type' é obrigatório"
  }

  if(!cliente.country){
    return "O campo 'country' é obrigatório"
  }

  if(!cliente.name){
    return "O campo 'name' é obrigatório"
  }

  if(!cliente.documents){
    return "O campo 'documents' é obrigatório"
  }

  if(!cliente.documents[0].type){
    return "O campo 'type' do documento é obrigatório"
  }

  if(!cliente.documents[0].number){
    return "O campo 'number' é obrigatório"
  }

  if(cliente.type !== "individual" ){
    return "Não é possível realizar a venda para este tipo de cliente"
  }

  if(typeof cliente.type !== "string"){
    return "O campo 'type' deve ser preenchido com um texto"
  }

  if(typeof cliente.country !== "string"){
    return "O campo 'country' deve ser preenchido com um texto"
  }

  if(typeof cliente.name !== "string"){
    return "O campo 'name' deve ser preenchido com um texto"
  }

  if(typeof cliente.documents[0].type !== "string"){
    return "O campo 'type' de documents deve ser preenchido com um texto"
  }

  if(!cliente.name.includes(" ")){
     return "O nome deve conter primeiro nome e sobrenome";
  }

  if(cliente.country.length !== 2){
     return "A sigla do país só pode conter dois carácteres"
  }

  if(cliente.documents[0].number.length !== 11){
     return "O campo 'number' do cpf precisa conter 11 dígitos"
  }

}


async function finalizarCompra(req, res){

  const listaDeProdutos = await lerArquivo();

  
  if(listaDeProdutos.carrinho.produtos.length < 1){
    res.status(400);
    res.json({erro: "Não há produtos no carrinho"});
    return;
  }

  const erro = validarCliente(req.body);

  if(erro){
    res.status(400);
    res.json({erro});
    return;
  }

  const cliente = {
    type: req.body.type,
    country: req.body.country,
    name: req.body.name,
    documents: [{
      type: req.body.documents[0].type,
      number: req.body.documents[0].number
    }],
  }

  listaDeProdutos.carrinho.dataDeEntrega = addBusinessDays(new Date(), 15);
  const compraEfetuada = {
    mensagem: "Compra efetuada com sucesso!",
    carrinho: montarCarrinho(listaDeProdutos.carrinho)
  }

  for(const produto of listaDeProdutos.produtos){
    for(const produtoNoCarrinho of listaDeProdutos.carrinho.produtos){
      if(produto.id === produtoNoCarrinho.id){
        produto.estoque -= produtoNoCarrinho.quantidade;
      }
    }
  }
  res.json(compraEfetuada);

  listaDeProdutos.carrinho.produtos = [];
  listaDeProdutos.carrinho.subtotal = 0;
  listaDeProdutos.carrinho.valorDoFrete = 0;
  listaDeProdutos.carrinho.dataDeEntrega = null;
  listaDeProdutos.carrinho.totalAPagar = 0;

  await escreverNoArquivo(listaDeProdutos);

}

module.exports={listarTodosOsProdutos,
detalharCarrinho, 
adicionarAoCarrinho, 
modificarCarrinho, 
removerDoCarrinho, 
limparCarrinho,
finalizarCompra };