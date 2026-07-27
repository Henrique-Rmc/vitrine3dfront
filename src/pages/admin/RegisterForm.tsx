import { useAuth } from '../../context/AuthContext'
import RegistrationForm from '../../components/form/RegistrationForm'

export default function RegisterForm() {
  const { register } = useAuth()

  return (
    <RegistrationForm
      onSubmit={register}
      fallbackErrorMessage="Erro ao criar conta. Verifique os dados e tente novamente."
      showSlugPreview
      storeNameLabel="Nome da loja"
      storeNamePlaceholder="Ateliê da Maria"
      descriptionLabel="Descrição da loja"
      descriptionPlaceholder="Joias artesanais em prata e pedras naturais, feitas à mão com amor."
      descriptionHint="Apresente seus serviços para os clientes."
      whatsappHint="Digite o DDD e o número. O +55 é adicionado automaticamente."
      logoLabel="Logo da loja"
      logoHint="PNG, JPG ou WebP · pode ser adicionado depois nas Configurações"
      logoProcessingLabel="Optimizing image..."
      showLogoFileName
      includeCommercializationClause
      submitLabel="Criar conta grátis"
      submitLoadingLabel="Criando conta…"
    />
  )
}
